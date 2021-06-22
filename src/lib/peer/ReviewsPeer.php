<?php
/**
 * Rtk Kanji Flashcards Peer.
 * 
 * This table stores the review status of all kanji flashcards for all users.
 * 
 * Methods:
 *  getFlashcardData($userId, $ucsId)
 *  getFlashcardsByIndex($userId, $filter = null)
 *  getFlashcardCount()
 *  getKnownKanji()
 *  getTodayCount()
 *  getCountExpired()
 *  getCountUntested()
 *  getCountRtK3()
 *  getLeitnerBoxCounts()
 *  getReviewedFlashcardCount()
 *  getMaximumSequenceNumber()
 *  getHeisigProgressCount()
 *  getTotalReviews()
 *  getMostRecentReviewTimeStamp()
 *  getSelectForDetailedList()
 *  getSelectForExport()
 *  getFlashcardsForReview()
 *
 *  hasFlashcard($userId, $ucsId)
 *  isFailedCard($userId, $ucsId)
 *
 *  putFlashcardData($id, $oData)
 *  failFlashcard($userId, $ucsId)
 *
 *  addSelection()
 *  deleteSelection()
 *  filterExistingCards($userId, array $cards)
 *
 * Private:
 *  addFlashcards()    Add/delete at once with a SQL statement.
 *  deleteFlashcards()
 *
 * Helpers:
 *  filterByRtk()      Applies framenum filter to the select object.
 *  filterByUserId()   Applies userid filter to the select object.
 * 
 * 
 * @author  Fabrice Denis
 */

class ReviewsPeer extends coreDatabaseTable
{
  protected
    $tableName = 'reviews',
    $columns   = [];  // timestamp columns must be declared for insert/update/replace

  /**
   * This function must be copied in each peer class.
   */
  public static function getInstance()
  {
    return coreDatabaseTable::_getInstance(__CLASS__);
  }

  /**
   * Returns flashcard status for given user and character id.
   *
   * The results are cached, so that the function can be used freely by
   * helpers.
   * 
   * @return mixed   Row data as object, or false.
   */
  public static function getFlashcardData($userId, $ucsId)
  {
    // debug: make sure it's not a (obsolete) frame number
    assert((int)$ucsId > 0x3000);

    $context = sfContext::getInstance();
    $key = 'fc-data-'.$ucsId;

    // return the cached data if it has already been fetched
    if ($context->has($key))
    {
      $cardData = $context->get($key);
    }
    else
    {
      self::getInstance()->select([
        '*',
        'ts_lastreview' => 'UNIX_TIMESTAMP(lastreview)'
      ])->where('ucs_id = ? AND userid = ?', [$ucsId, $userId])->query();
      $cardData = self::$db->fetchObject();
      $context->set($key, $cardData);
    }

    return $cardData;
  }

  /**
   * Returns true if user has a flashcard for given character UCS code.
   * 
   * @param int   $userId 
   * @param int   $ucsId
   *
   * @return bool
   */
  public static function hasFlashcard($userId, $ucsId)
  {
    $count = self::getInstance()->count('userid = ? AND ucs_id = ?', [$userId, $ucsId]);
    return (bool)$count;
  }

  /**
   * Checks if a flashcard is "failed" (in the red stack/box 1)
   * 
   * @param  int   $userId
   * @param  int   $ucsId    UCS-2 code value.
   *
   * @return boolean
   */
  public static function isFailedCard($userId, $ucsId)
  {
    $cardData = self::getFlashcardData($userId, $ucsId);

    return (is_object($cardData) && $cardData->leitnerbox == 1 && $cardData->totalreviews > 0);
  }

  /**
   * Returns an array of flashcard ids in the user's deck, as *indexes*.
   *
   * Note: if filter is not used, cards outside of the active sequence will be
   * returned, which have an *extended frame number* (UCS codes).
   * 
   * @param  int    $userId
   * @param  string $filter  See filterByRtk()
   * 
   * @return array  Array of frame numbers, empty array if no cards
   */
  public static function getFlashcardsByIndex($userId, $filter = '')
  {
    $select = self::getInstance()->select(['seq_nr' => rtkIndex::getSqlCol()]);
    
    // join Kanjis table just once
    if ($filter === '')
    {
      $select = KanjisPeer::joinLeftUsingUCS($select);
    }
    else
    {
      $select = self::filterByRtk($select, $filter);
    }

    $select = self::filterByUserId($select, $userId);

    return self::$db->fetchCol($select);
  }
  
  /**
   * Do a COUNT(*) on the select object, return integer result.
   * 
   * @param  int    $userId  User id.
   * @param  coreDatabaseSelect  $select   Select object with where clause(s) applied.
   * 
   * @return int
   */
  protected static function _getFlashcardCount($userId, $select = null)
  {
    if (is_null($select))
    {
      $select = self::getInstance()->select();
    }

    $select->columns(['count' => 'COUNT(*)']);
    $select = self::filterByUserId($select, $userId);
//DBG::printr($select->__toString());
    $select->query();
    $result = self::$db->fetchObject();
    return (int) $result->count;
  }

  /**
   * Return count of all flashcards for user.
   * 
   * @return 
   */
  public static function getFlashcardCount($userId)
  {
    return self::_getFlashcardCount($userId);
  }

  /**
   * Returns a string of all kanji known by user. Currently 'known' simply
   * means the user has a flashcard for it.
   */
  public static function getKnownKanji($userId)
  {
    $user = sfContext::getInstance()->getUser();

    // get array of known kanji as ucs ids (this simple SELECT uses INDEX)
    $select = self::getInstance()->select()->columns('ucs_id');
    $select = self::filterByUserId($select, $userId);
    $ucs_array = self::$db->fetchCol($select);

    // convert to utf8 string for storage
    $knownKanji = count($ucs_array) ? utf8::fromUnicode($ucs_array) : '';

    return $knownKanji;
  }

  /**
   * Return count of flashcards reviewed today (midnight time).
   *
   */
  public static function getTodayCount($userId)
  {
    $user = sfContext::getInstance()->getUser();
    $select = self::getInstance()->select()->where('lastreview > DATE('.UsersPeer::sqlLocalTime().')');
    return self::_getFlashcardCount($userId, $select);
  }

  /**
   * Return count of expired flashcards (except failed cards) for user.
   * 
   * @param
   * 
   * @return
   */
  public static function getCountExpired($userId)
  {
    $user = sfContext::getInstance()->getUser();
    $sqlLocalTime = new coreDbExpr(UsersPeer::sqlLocalTime());
    $select = self::getInstance()->select()->where('totalreviews>0 AND leitnerbox>1  AND expiredate <= ?', $sqlLocalTime);
    return self::_getFlashcardCount($userId, $select);
  }

  /**
   * Return count of untested flashcards for user.
   * 
   * @param  string  $filter  See filterByRtk()
   * 
   * @return
   */
  public static function getCountUntested($userId, $filter = '')
  {
    $user = sfContext::getInstance()->getUser();
    $select = self::getInstance()->select()->where('totalreviews <= 0');
    $select = self::filterByRtk($select, $filter);
    return self::_getFlashcardCount($userId, $select);
  }

  /**
   * Return count of flashcards for RtK Volume 3 kanji.
   * 
   * @return 
   */
  public static function getCountRtK3($userId)
  {
    $user = sfContext::getInstance()->getUser();
    $select = self::getInstance()->select();
    $select = self::filterByRtk($select, 'rtk3');
    return self::_getFlashcardCount($userId, $select);
  }


  /**
   * Return flashcard counts for Leitner boxes.
   * 
   * Returns
   *
   *     [
   *       'expired_cards' => 20,
   *       'fresh_cards'   => 10,
   *       'total_cards'   => 30
   *     ],
   * 
   * @param  string   $filter  Filter by RtK Volume 1, 3, or all (see filterByRtk())
   * 
   * @return array   Array of box data (including empty boxes), index 0 = failed/new cards.
   */
  public static function getLeitnerBoxCounts($filter = '')
  {
    $user = sfContext::getInstance()->getUser();

    $select = self::getInstance()->select([
        'box'   => 'leitnerbox',
        'due'   => sprintf('(%s >= expiredate)', UsersPeer::sqlLocalTime()),
        'count' => 'COUNT(*)'
      ])
      ->where('totalreviews > 0')
      ->group(['leitnerbox', 'due ASC']);
    
    $select = self::filterByUserId($select, $user->getUserId());
    $select = self::filterByRtk($select, $filter); // FIXME  we don't strictly need sequences JOIN here
    $rows   = self::$db->fetchAll($select);

    // do not assume a fixed box setting, do assume SQL data is not messed up
    $highest_box = count($rows) ? max(array_column($rows, 'box')) : 1;

    $boxes = [];
    for ($i = 0; $i < $highest_box; $i++) {
      $boxes[$i] = ['expired_cards' => 0, 'fresh_cards' => 0, 'total_cards' => 0];
    }

    // set due & undue counts
    foreach ($rows as $row) {
      $i    = intval($row['box'] - 1);
      $pile = $row['due'] ? 'expired_cards' : 'fresh_cards';
      $boxes[$i][$pile] += $row['count'];
    }

    // set totals per box
    for ($i = 0; $i < $highest_box; $i++) {
      $boxes[$i]['total_cards'] = $boxes[$i]['expired_cards'] + $boxes[$i]['fresh_cards'];
    }
    
    return $boxes;
  }

  /**
   * Returns number of kanji flashcards with at least one review.
   *
   * @param  int     $minBox  Minimum leitnerbox (optional)
   * 
   * @return int
   */
  public static function getReviewedFlashcardCount($userId, $minBox = 0)
  {
    $condition = $minBox ? 'totalreviews > 0 AND leitnerbox >= '.$minBox : 'totalreviews > 0';

    $select = self::getInstance()->select()->where($condition);
    return self::_getFlashcardCount($userId, $select);
  }

  /**
   * Returns the number of kanji flashcards in RTK1 (only!) Heisig order.
   *
   * If there is any gap in the *RTK1* frame number range, it returns false.
   *
   * @return mixed  Heisig RTK1 progress count (int) or false
   */
  public static function getHeisigProgressCount($userId)
  {
    // get the flashcard count in the RTK1 range
    $select = self::getInstance()->select()->where(rtkIndex::getSqlCol().' <= ?', rtkIndex::inst()->getNumCharactersVol1());
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $flashcardCount = self::_getFlashcardCount($userId, $select);
    
    // compare the count to the max in that range
    $select->columns(['max' => 'MAX('.rtkIndex::getSqlCol().')'])->query();
    $result = self::$db->fetchObject();
    $maxRtkSeqNr = (int) $result->max;

    if ($flashcardCount !== $maxRtkSeqNr)
    {
      return false;
    }
    
    return $maxRtkSeqNr;
  }
  
  /**
   * Returns progress status for Check Progress page.
   *
   * All flashcards not in the current sequence will be in lesson 0.
   * 
   * Returns:
   *  array( <lessNr> => array( <lessonId>, <total>, <pass>, <fail> ), ... )
   *     
   * @return  array  Array of objects
   */
  public static function getProgressChartData($userId)
  {
    $select = self::getInstance()->select(['ucs_id', 'seq_nr' => rtkIndex::getSqlCol(), 'leitnerbox', 'totalreviews', 'failurecount', 'successcount']);
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select = self::filterByUserId($select, $userId);
    $select->query();

    $lessons = [];

    while ($row = self::$db->fetchObject())
    {
      $lessNr = rtkIndex::getLessonForIndex((int)$row->seq_nr);

      if (!isset($lessons[$lessNr])) {
        $lessons[$lessNr] = (object) ['lessonId' => $lessNr, 'total' => 0, 'pass' => 0, 'fail' => 0];
      }

      // ref
      $lesson =& $lessons[$lessNr];

      $lesson->total++;
      
      if ($row->leitnerbox > 1 && $row->totalreviews > 0) {
        $lesson->pass++;
      }
      elseif ($row->leitnerbox == 1 && $row->totalreviews > 0) {
        $lesson->fail++;
      }
    }
      
/*
    $select = self::getInstance()->select(array(
        'lessonId'  => 'lessonnum',
        'total'     => 'COUNT(*)',
        'pass'      => 'SUM(leitnerbox > 1 AND totalreviews > 0)',
        'fail'      => 'SUM(leitnerbox = 1 AND totalreviews > 0)'
      ));
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select->group('lessonnum ASC');
*/

//DBG::printr($lessons);exit;

    return $lessons;
  }

  /**
   * Return total reviews accross all kanji,
   * for the Profile page.
   * 
   * @return int
   */
  public static function getTotalReviews($userId)
  {
    $select = self::$db->select(['count' => 'SUM(totalreviews)'])->from('reviews');
    self::filterByUserId($select, $userId)->query();
    $row = self::$db->fetchObject();
    return (int)$row->count;
  }

  /**
   * Return the most recent flash card review timestamp
   * (of a single flash card, not a review session).
   * 
   * @param  int    $userId   User id.
   * @return mixed  Lastest review timestamp, or FALSE
   */
  public static function getMostRecentReviewTimeStamp($userId)
  {
    $select = self::getInstance()->select('MAX(lastreview)');
    $select = self::filterByUserId($select, $userId);
    $ts_lastreview = self::$db->fetchOne($select);
    return !is_null($ts_lastreview) ? $ts_lastreview : false;
  }

  /**
   * Returns Select for detailed flashcard lists.
   * 
   * Used on:
   * - Detailed Flashcard List
   * - Manage Flashcards > Select flashcards to remove (RemoveListTableComponent)
   * 
   * @param
   * @return
   */
  public static function getSelectForDetailedList($userId)
  {
    $select = self::getInstance()->select([
      'kanjis.ucs_id', 'seq_nr' => rtkIndex::getSqlCol(), 'failurecount', 'successcount', 'leitnerbox',
      'ts_lastreview' => 'UNIX_TIMESTAMP(lastreview)', 'kanji', 'onyomi', 'strokecount',
      'tsLastReview' => 'UNIX_TIMESTAMP(lastreview)'
      ]);
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select = self::filterByUserId($select, $userId);
    $select = CustkeywordsPeer::addCustomKeywordJoin($select, $userId);
    return $select;
  }

  /**
   * Returns Select for Manage > Edit Keywords table.
   * 
   * @return coreDatabaseSelect
   */
  public static function getSelectForEditKeywordsList($userId)
  {
    $select = self::getInstance()->select([
      'kanjis.ucs_id', 'kanji', 'seq_nr' => rtkIndex::getSqlCol(),
      'kanjis.keyword', 'custkeyword' => 'custkeywords.keyword',
      'ts_lastreview' => 'UNIX_TIMESTAMP(lastreview)'
      ]);
    $select = KanjisPeer::joinLeftUsingUCS($select);
    
    // don't use addCustomKeywordJoin() here because we want BOTH original & custom keyword
    $select->joinLeftUsing('custkeywords', ['ucs_id', 'userid']);
    
    $select = self::filterByUserId($select, $userId);

    return $select;
  }
  
  /**
   * Returns select for flashcard export feature.
   * 
   * @param int  $userId
   */
  public static function getSelectForExport($userId)
  {
    // the order of columns must match the ExportCSV call in executeExportflashcards() ! 
    $select = self::getInstance()->select([
      'seq_nr' => rtkIndex::getSqlCol(), 'kanji',
      'keyword' => CustkeywordsPeer::coalesceExpr(),
      'lastreview', 'expiredate', 'leitnerbox', 'failurecount', 'successcount']);
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select = CustkeywordsPeer::addCustomKeywordJoin($select, $userId);
    $select->order('seq_nr', 'ASC');
    $select = self::filterByUserId($select, $userId);
    return $select;
  }

  /**
   * Get a selection of flashcards for review, as an array of flashcard ids.
   * 
   * Orders flashcards by expiredate (longest expired first), and then
   * randomize cards that expire on the same date.
   * 
   * Only works for current user (sqlLocalTime).
   * 
   * @param  mixed    $box    'all' or a Leitner box number starting from 1
   * @param  string   $type   'expired', 'untested', 'relearned', 'known', anything else means 'fresh' (non-expired)
   * @param  string   $filt   'rtk1', 'rkt3', '' for all kanji
   * @param  boolean  $merge  True to merge flashcards from given box with higher boxes
   * 
   * @return array    Flashcard ids (normalized as int).
   */
  public static function getFlashcardsForReview($box, $type, $filt, $merge = false)
  {
    $user = sfContext::getInstance()->getUser();
    $userId = $user->getUserId();
    $sqlLocalTime = new coreDbExpr(UsersPeer::sqlLocalTime());

    if ($type === 'relearned')
    {
      // select cards from relearned kanji selection
      $select = LearnedKanjiPeer::getInstance()->select('ucs_id');
      $select->where('userid = ?', $userId);
    }
    else
    {
      $select = self::getInstance()->select('ucs_id');
      $select = self::filterByUserId($select, $userId);

      if ($filt !== '') {
        $select = self::filterByRtk($select, $filt);
      }
    }

    switch ($type)
    {
      case 'untested':
        $order_by = 'expiredate';

        if ($user->getUserSetting('OPT_NO_SHUFFLE')) {
          // do not shuffle new cards, order by sequence number
          $select->columns(['seq_nr' => rtkIndex::getSqlCol()]);
          $select = KanjisPeer::joinLeftUsingUCS($select);
          $order_by = $order_by . ', ' . rtkIndex::getSqlCol() . ' ASC';
        }
        else {
          $order_by = $order_by . ', RAND()';
        }
        $select->where('totalreviews = 0');
        $select->order($order_by);
        break;
        
      case 'relearned':
        $select->order('RAND()');
        break;

      default:
        if ($type == 'known') {
          // known cards are all cards reviewed once and not currently in the failed stack
          // $box should be 'all' (cf. below)
        }
        elseif ($type == 'expired') {
          // expired cards (orange stacks, due for review)
          $select->where('totalreviews > 0 AND expiredate <= ?', $sqlLocalTime);
        }
        else {
          // fresh cards (green stacks, not due for review)
          $select->where('totalreviews > 0 AND expiredate > ?', $sqlLocalTime);
        }
        
        if ($box == 'all') {
          $select->where('leitnerbox > 1');
        }
        elseif ($merge) {
          $select->where('leitnerbox >= ?', $box);
        }
        else {
          $select->where('leitnerbox = ?', $box);
        }

        // "known" cards (free review mode) don't care about expiry date
        $select->order($type == 'known' ? 'RAND()' : 'expiredate, RAND()');
        break;
    }

// DBG::out($select);exit;

    $ids = self::$db->fetchCol($select);

    return array_map('intval', $ids);
  }

  /**
   * Return array of cards with the day diff for each due card over the next N
   * days.
   *
   * @param   int     $userId
   *
   * @return  array   Array of day diffs (1 column), or empty array
   */
  public static function getDueCardsByDay()
  {
    $user = sfContext::getInstance()->getUser();
    $exprLocalTime = UsersPeer::sqlLocalTime();
    $exprDayDiff   = 'DATEDIFF(expiredate, '.$exprLocalTime.')';

    $select = self::getInstance()->select(new coreDbExpr($exprDayDiff))
      ->where('userid = ?', $user->getUserId())
      ->where('leitnerbox > 1') // not failed or new cards
      ->where('expiredate < DATE_ADD('.$exprLocalTime.', INTERVAL '.DueCardsGraphComponent::GRAPH_DAYS.' DAY)');

//echo $select;exit;
   return self::$db->fetchCol($select);
  }

  /**
   * Returns Select object for the Review Summary page.
   *
   * Select all flashcards reviewed since the given (localized) timestamp.
   * 
   * @see    getLocalizedTimestamp()
   * 
   * @param  int    $userId  
   *
   * @return coreDatabaseSelect
   */
  public static function getReviewSummaryListSelect($userId, $ts_start)
  {
    $select = self::getInstance()->select([
      'seq_nr' => rtkIndex::getSqlCol(), 'failurecount', 'successcount', 'leitnerbox', 'ts_lastreview' => 'UNIX_TIMESTAMP(lastreview)',
      'kanji', 'onyomi', 'strokecount']);
    $select->where('UNIX_TIMESTAMP(lastreview) >= ?', $ts_start);
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select = self::filterByUserId($select, $userId);
    $select = CustkeywordsPeer::addCustomKeywordJoin($select, $userId);
//DBG::out($select);exit;
    return $select;
  }

  /**
   * Return count of failed kanji for user.
   * 
   * @param
   * @return
   */
  public static function getRestudyKanjiCount($userId)
  {
    return self::getInstance()->count('userid = ? AND leitnerbox=1 AND totalreviews>0', $userId);
  }

  /**
   * Return select object for the Restudy Kanji list.
   * 
   * @param  integer   $userId
   * 
   * @return coreDatabaseSelect
   */
  public static function getRestudyKanjiListSelect($userId)
  {
    $select = self::getInstance()
      ->select(['seq_nr' => rtkIndex::getSqlCol(), 'kanji', 'successcount', 'failurecount', 'ts_lastreview' => 'UNIX_TIMESTAMP(lastreview)']);
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select = CustkeywordsPeer::addCustomKeywordJoin($select, $userId);
    $select->where('leitnerbox=1 AND totalreviews>0');
    $select = self::filterByUserId($select, $userId);
    return $select;
  }

  /**
   * Return data for Restudy List "quick" view in the side column of the Study page.
   * 
   * Returns all failed kanji that are not currently in the learned list.
   * 
   * @param
   * 
   * @return array<array>  Resultset
  public static function getRestudyQuickList($userId)
  {
    $select = self::getInstance()->select(array('seq_nr' => rtkIndex::getSqlCol()));
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select->joinLeftUsing('learnedkanji', 'userid, ucs_id');
    $select = self::filterByUserId($select, $userId);
    $select = CustkeywordsPeer::addCustomKeywordJoin($select, $userId);

    $select->where('leitnerbox=1 AND totalreviews>0')
      ->where('learnedkanji.ucs_id IS NULL')  // not in the learned list
      ->order('seq_nr')
      ->limit(10);

    return self::$db->fetchAll($select);
  }
  */

  /**
   * Returns the first kanji in index order,
   * which is in the failed stack and not yet "learned".
   * 
   * @return mixed  UCS-2 code value (int) of the next restudy kanji, or false
   */
  public static function getNextUnlearnedKanji($userId)
  {
    $tableName = self::getInstance()->getName();
    $select = self::getInstance()->select($tableName.'.ucs_id');
    $select = KanjisPeer::joinLeftUsingUCS($select);
    $select->joinLeftUsing('learnedkanji', 'userid, ucs_id');
    $select = self::filterByUserId($select, $userId);
    
    $select->where('leitnerbox=1 AND totalreviews>0')
      ->where('learnedkanji.ucs_id IS NULL')  /* not in the learned list */
      ->order(rtkIndex::getSqlCol().' ASC')
      ->limit(1);

    $ucsId = self::$db->fetchOne($select);

    return $ucsId !== false ? intval($ucsId) : false;
  }

  /**
   * Filter flashcard selection by frame number for given RtK Volume
   * (or no filter = all).
   * 
   * @param  coreDatabaseSelect   $select
   * @param  string   $filter     'rtk1', 'rtk3', 'rtk1+3', '' (no filter)
   * 
   * @return coreDatabaseSelect   Returns modified select object
   */
  private static function filterByRtk($select, $filter = '')
  {
    // always add Sequences join, will be discarded by SQL if not used anyway
    $curSeq = rtkIndex::inst();

    if ($filter !== '')
    {
      $select = KanjisPeer::joinLeftUsingUCS($select);
      $idxCol = rtkIndex::getSqlCol();

      switch ($filter)
      {
        case 'rtk1':
          $select->where($idxCol.' <= ?', $curSeq->getNumCharactersVol1());
          break;
        case 'rtk3':
          $select->where($idxCol.' > ? AND '.$idxCol.' <= ?', [$curSeq->getNumCharactersVol1(), $curSeq->getNumCharactersVol3()]);
          break;
        case 'rtk1+3':
          $select->where($idxCol.' <= ?', $curSeq->getNumCharacters());
          break;
        default:
          break;
      }
    }

    return $select;
  }

  /**
   * Apply user id filter to select object.
   * 
   * @param  coreDatabaseSelect  $select
   * @param  int   $userId
   * 
   * @return coreDatabaseSelect
   */
  public static function filterByUserId(coreDatabaseSelect $select, $userId)
  {
    return $select->where(self::getInstance()->getName().'.userid = ?', $userId);
  }

  /**
   * uiFlashcardReview callback for the review page.
   * 
   * Note: must sanitize data!
   * 
   * Flashcard answer data is set by the front end code (review.js):
   * 
   *    id     Flashcard id = UCS-2 code value
   *    r      Answer (cf. uiFlashcardReview.php const)
   *    
   * @param  int      $id     Flashcard id (UCS-2 code value)
   * @param  object   $oData  Flashcard answer data
   *
   * @return boolean   True if update/skip/delete went succesfully
   */
  public static function putFlashcardData($id, $oData)
  {
    if ($id < 1 || !isset($oData->r) || !preg_match('/^[1-5h]$/', $oData->r))
    {
      throw new sfException(__METHOD__." Invalid parameters ($id)");
    }

//DBG::printr($oData);

    $userId = sfContext::getInstance()->getUser()->getUserId();

    if ($oData->r === uiFlashcardReview::UIFR_SKIP)
    {
      // skip this flashcard, don't update it
      $result = true;
    }
    elseif ($oData->r === uiFlashcardReview::UIFR_DELETE)
    {
      // delete the flashcard
      $deleted = self::deleteFlashcards($userId, [$id]);
      $result = count($deleted) > 0;
      
      sfContext::getInstance()->getEventDispatcher()->notify(new sfEvent(null, 'flashcards.update', []));
    }
    else
    {
      // get current review status
      $select = self::getInstance()
        ->select(['totalreviews','leitnerbox','failurecount','successcount','lastreview'])
        ->where('ucs_id = ?', $id);
      $select = self::filterByUserId($select, $userId);
      $select->query();
      $curData = self::$db->fetchObject();
      if (!$curData) {
        // if the card was somehow deleted, return true so the client can clear the card from sync buffer
        return true;
      }

      $oUpdateData = LeitnerSRS::rateCard($curData, $oData->r);

      $result = self::updateFlashcard($userId, $id, $oUpdateData);
    }

    // clear relearned kanji if successfull answer
    // NOTE: expected for API
    if ($result && rtkApi::isApiModule()
        && ($oData->r === uiFlashcardReview::UIFR_HARD ||
            $oData->r === uiFlashcardReview::UIFR_YES  ||
            $oData->r === uiFlashcardReview::UIFR_NO   ||
            $oData->r === uiFlashcardReview::UIFR_EASY ||
            $oData->r === uiFlashcardReview::UIFR_DELETE))
    {
      LearnedKanjiPeer::clearKanji($userId, $id);
    }

    return $result;
  }

  public static function updateFlashcard($userId, $ucsId, $cardData)
  {
    return self::getInstance()->update($cardData, 'userid = ? AND ucs_id = ?', [$userId, $ucsId]);
  }

  /**
   * Moves flashcard to the red pile (stack 1) by rating it as "No".
   * 
   * @param int   $userId 
   * @param int   $ucsId
   *
   * @return bool   Returns false if SQL operation failed.
   */
  public static function failFlashcard($userId, $ucsId)
  {
    $cardData = ReviewsPeer::getFlashcardData($userId, $ucsId);
    if ($cardData === false)
    {
      return false;
    }

    // rate card as "not remembered" (No)
    $oUpdateData = LeitnerSRS::rateCard($cardData, 1);

    return self::updateFlashcard($userId, $ucsId, $oUpdateData);
  }

  /**
   * Add a set of new flashcards to the user's deck.
   * 
   * Note: remove duplicate cards first with filterExistingCards() !
   * 
   * @param   int     $userId
   * @param   array   $cardSel   Array of UCS-2 codes
   * 
   * @return array  Array of successfully added flashcard ids
   */
  static public function addSelection($userId, array $cardSel)
  {
    // create new flashcards
    $cards = ReviewsPeer::addFlashcards($userId, $cardSel);
    if (count($cards))
    {
      ActiveMembersPeer::updateFlashcardCount($userId);

      sfContext::getInstance()->getEventDispatcher()->notify(new sfEvent(null, 'flashcards.update', []));

    }
    return $cards;
  }

  /**
   * Delete all given flashards, returns an array of ids of flashcards
   * that were succesfully deleted.
   * 
   * @param   int     $userId
   * @param   array   $cardSel   Array of flashcard ids (UCS-2)
   * 
   * @return array  Array of successfully deleted flashcards (ids) or false
   */
  static public function deleteSelection($userId, array $cardSel)
  {
    $cards = ReviewsPeer::deleteFlashcards($userId, $cardSel);
    if (is_array($cards) && count($cards))
    {
      ActiveMembersPeer::updateFlashcardCount($userId);

      sfContext::getInstance()->getEventDispatcher()->notify(new sfEvent(null, 'flashcards.update', []));
    }
    return $cards;
  }

  /**
   * Filter out flashcard ids in the selection that are already present in the
   * user's deck. Returns an array with only the flashcard ids that don't
   * exist in the user's deck.
   * 
   * @param   int     $userId
   * @param   array   $cards       Array of UCS-2 codes
   *
   * @return  array   Array of UCS-2 codes
   */
  static public function filterExistingCards($userId, array $cards)
  {
    $select = self::getInstance()->select('ucs_id');
    $select = self::filterByUserId($select, $userId);

    // array of flashcard ids that are in the user's deck
    $userCards = self::$db->fetchCol($select);

    // filter out ids that are in both sets
    $newCards = array_diff($cards, $userCards);

    return $newCards;
  }

  /**
   * Add a set of flashcards all at once.
   *
   * Duplicate entries should be filtered out before calling this method!
   * 
   * @param  int    $userId
   * @param  array  $cards    Array of UCS-2 codes
   * 
   * @return array  Returns an array with ids of succesfully created flashcards
   */
  private static function addFlashcards($userId, array $cards)
  {
    $tableName = self::getInstance()->getName();
    
    // only lock if necessary
    $lockTable = count($cards) > 20;

    // lock the table (to speedup index) (minimal speed gain..)
    if ($lockTable) {
      self::$db->query('LOCK TABLE '.$tableName.' WRITE');
    }

    // prepare statement and execute for all cards
    $stmt = new coreDatabaseStatementMySQL(self::$db,
      sprintf('INSERT %s (userid,ucs_id,created_on,leitnerbox) VALUES (%d,?,NOW(),1)', $tableName, $userId));

    try
    {
      $done = [];
      foreach ($cards as $id)
      {
        if (!$stmt->execute([$id]))
        {
          break;
        }
        $done[] = $id;
      }
    }
    catch (sfException $e)
    {
    }

    // unlock table
    if ($lockTable) {
      self::$db->query('UNLOCK TABLES');
    }

    // return succesfully added ids
    return $done;
  }

  /**
   * Delete a set of flashcards.
   *
   * @param  int    $userId
   * @param  array  $cards    Array of flashcard ids (UCS-2)
   * 
   * @return array  Returns an array of succesfully deleted flashcard ids or false
   */
  private static function deleteFlashcards($userId, $cards)
  {
    $tableName = self::getInstance()->getName();
  
    // only lock if necessary
    $lockTable = count($cards) > 20;

    // lock the table (to speedup index) (minimal speed gain..)
    if ($lockTable) {
      self::$db->query('LOCK TABLE '.$tableName.' WRITE');
    }

    // prepare statement and execute for all cards
    $stmt = new coreDatabaseStatementMySQL(self::$db,
      sprintf('DELETE FROM %s WHERE userid = %d AND ucs_id = ?', $tableName, $userId));

    try
    {
      $done = [];
      foreach ($cards as $id)
      {
        if (!$stmt->execute([$id]))
        {
          break;
        }
        if ($stmt->rowCount() > 0) {
          $done[] = $id;
        }
      }
    }
    catch (sfException $e)
    {
      $done = false;
    }

    // unlock table
    if ($lockTable) {
      self::$db->query('UNLOCK TABLES');
    }

    // return succesfully added ids
    return $done;
  }
}

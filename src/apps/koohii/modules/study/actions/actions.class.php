<?php
/** 
 * 
 * Actions:
 *   executeIndex()
 *   executeClear()
 *   executeFailedlist()
 *   executeFailedlisttable
 *   executeSharedStoriesList()
 *   executeMystories()
 *   executeMyStoriesTable()
 *   executeEditstory()
 *   executeEditkeyword()
 *   executeAjax()
 *   executeDict()
 *   executeVocabpick()
 *   executeVocabdelete()
 */
class studyActions extends sfActions
{

  /**
   * Study page.
   * 
   * @return 
   */
  public function executeIndex($request)
  {
  }

  /**
   * Study Page Search
   * 
   * Convert the search term to a framenum parameter and forward to index.
   * 
   * @url  /study/kanji/:id
   *
   */
  public function executeEdit($request)
  {
    $userId = $this->getUser()->getUserId();

    // stop bad users from overloading the database with their stupid scripts
    $throttler = new RequestThrottler($this->getUser(), 'baduser');
    $throttler->setInterval(1); // 1 seconds
    
    // searching or browsing (previous, next buttons)
    if ($request->getMethod()===sfRequest::GET)
    {

      // throttle all GET requests (browse and search)
      if (!$throttler->isValid())
      {
        $throttler->setTimeout(); // reset le timer
        $this->getResponse()->setContentType('html');
        return $this->renderPartial('misc/requestThrottleError');
      }
      $throttler->setTimeout();

      // restudy start (move to first failed card)
      if ($request->hasParameter('restudy'))
      {
        // should always have >= 1 failed card here
        $ucsId = ReviewsPeer::getNextUnlearnedKanji($userId);
        $this->forward404Unless($ucsId !== false);

        // the flag is also the restudy total
        $restudyCount = ReviewsPeer::getRestudyKanjiCount($userId);
        $this->getUser()->setAttribute(rtkUser::IS_RESTUDY_SESSION, $restudyCount);
      }
      // study
      else
      {
        // get search term from url
        $search = trim($request->getParameter('id', ''));
        
        if (!empty($search))
        {
          $search = CJK::normalizeFullWidthRomanCharacters($search);

          // replace characters that caused problems (dashes) with wildcard for SQL
          $search = str_replace('-', '%', $search);

          $ucsId = $this->getUCSForSearch($search, $userId); 
        }
      }
    }
    else
    {
      $ucsId = rtkValidators::sanitizeCJKUnifiedUCS($request->getParameter('ucs_code', 0));

      // "Add to learned list"
      if ($request->hasParameter('doLearned'))
      {
        LearnedKanjiPeer::addKanji($userId, $ucsId);

        // redirect to next restudy kanji
        $nextId = ReviewsPeer::getNextUnlearnedKanji($userId);
        if ($nextId !== false)
        {
          $kanji = KanjisPeer::getKanjiByUCS($nextId);
          $this->redirect('study/edit?id=' . $kanji->kanji);
        }
      }
    }

    // we have to test here because not every single "CJK unifed ideographs (4e00-9faf)" is guaranteed
    // to be in the database (RevTH sources characters from Kanjidic + RSH/RTH spreadsheets)
    if ($ucsId && ($this->kanjiData = KanjisPeer::getKanjiByUCS($ucsId)))
    {
      sfProjectConfiguration::getActive()->loadHelpers('CJK');


      // add request parameters for SharedStoriesListComponent view
      $request->getParameterHolder()->add(['ucsId' => $ucsId, 'keyword' => $this->kanjiData->keyword]);

      // replace search term with frame number in search box
      $request->setParameter('search', $this->kanjiData->framenum);

      // set descriptive lesson title
      $this->title = rtkIndex::getLessonTitleForIndex($this->kanjiData->framenum);

      // enable caching of Shared Stories list ONLY for Heisig indexed (~3000 items)
      if (false === rtkIndex::isExtendedIndex($this->kanjiData->framenum))
      {
        // sometimes we disable cache fin development
        if (null !== ($cacheManager = $this->getContext()->getViewCacheManager())) {
          // set cache to THIRTY days because we invalidate it whenever needed
          $cacheManager->addCache(
            'study', '_SharedStories', [
              'withLayout' => false,
              'lifeTime' => 60*60*24*30
            ]
          );
        }
      }
    }
    else
    {
      // search gave no results
      $this->kanjiData = false;
    }
  }

  /**
   * Clear learned list, then redirect to kanji
   * 
   * study/clear?goto=< kanji | 0 >
   * 
   */
  public function executeClear($request)
  {
    LearnedKanjiPeer::clearAll($this->getUser()->getUserId());

    // redirect
    if (null !== ($gotoKanji = $request->getParameter('goto'))) {
      $this->redirect('study/edit?id=' . $gotoKanji);
    }

    $this->forward404();
  }

  /**
   * Parse the search box text for a character (Heisig index, CJK character,
   * unicode code point "extended" index). Returns the UCS-2 code.
   *
   * The search term should be an exact keyword or match the beginning of a keyword.
   *
   * The multiple edition keyword separator (/) should be replaced with a wildcard (%) beforehand.
   *
   * The wildcard (%) can be used one or more times. A wildcard (%) is always added at the end
   * of the search term.
   *
   * @return  mixed   UCS-2 code value (integer), or false if no results.
   */
  protected function getUCSForSearch($sSearch, $userId)
  {
    $db = sfProjectConfiguration::getActive()->getDatabase();

    $s = trim($sSearch);
    //$s = preg_replace('/[^0-9a-zA-Z-\.\' \[\]\(\)]/', '', $s);
  
    if (CJK::hasKanji($s))
    {
      // it's not a western character..
      /* 0x3000 http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml */
      
      KanjisPeer::getInstance()->select('ucs_id')->where('kanji = ?', $s)->query();
      
      return ($row = $db->fetchObject()) ? (int)$row->ucs_id : false;
    }
    elseif (preg_match('/^[0-9]+$/', $s))
    {
      // could be a Heisig #, or a unicode # (UCS2)
      return rtkIndex::getUCSForIndex($s);
    }
    elseif (preg_match('/[^0-9]/', $s))
    {
      // try to find an exact match, match before and after the RTK edition separator
      $coalesce = CustkeywordsPeer::coalesceExpr();

      $select = KanjisPeer::getInstance()->select(['kanjis.ucs_id']);
      $select = CustkeywordsPeer::addCustomKeywordJoin($select, $userId);
      $select->where($coalesce . ' = ?', $s);

      // limits to selected index (RevTH only: returns correct char when simpl & trad. with same keyword)
      $select->where(rtkIndex::getSqlCol() . ' < ?', rtkIndex::RTK_UCS);  

      $select->query();

      if ($row = $db->fetchObject())
      {
        return (int)$row->ucs_id;
      }
      // minimum 3 characters for non-exact search to limit results
      elseif (strlen($s) < 3)
      {
        return false;
      }
      // otherwise just pick the first match
      else
      {
        $select->reset(coreDatabaseSelect::WHERE)
               ->where("$coalesce LIKE ?", $s.'%')
               ->query();
        return ($row = $db->fetchObject()) ? (int)$row->ucs_id : false;
      }
    }

    return false;
  }

  /**
   * Failed Kanji List.
   * 
   * @return 
   */
  public function executeFailedlist($request)
  {
  }

  /**
   * Failed Kanji List ajax table.
   * 
   * @return 
   */
  public function executeFailedlisttable($request)
  {
    $tron = new JsTron();
    return $tron->renderComponent($this, 'study', 'FailedListTable');
  }

  /**
   * Shared Stories List paging on the Study pages.
   * 
   * @return 
   */
  public function executeSharedStoriesList($request)
  {
    $tron = new JsTron();

    // throttle ajax requests to prevent script abuse
    //$response = $this->getResponse();
    $throttler = new RequestThrottler($this->getUser(), 'sharedstories');
    $throttler->setInterval(2);
    if (!$throttler->isValid())
    {
      $throttler->setTimeout();

      $tron->setError('<p>Please allow a couple seconds when paging through the stories. This '.
                      'helps us improve the website response time of the Study pages. Thanks! =)</p>');
      $tron->setStatus(JsTron::STATUS_FAILED);

      return $tron->renderJson($this);
    }
    $throttler->setTimeout();

    return $tron->renderComponent($this, 'study', 'SharedStoriesList');
  }

  /**
   * My Stories page.
   * 
   * @return 
   */
  public function executeMystories($request)
  {
    $sortkey = $request->getParameter('sort', false);
    $this->forward404Unless(!$sortkey || preg_match('/^(seq_nr|keyword|lastedit|votes|reports|public)$/', $sortkey));

    $this->sort_options = [
      [
        'value'        => 'seq_nr',
        'text'         => 'Frame#'
      ],
      [
        'value'        => 'keyword',
        'text'         => 'Keyword'
      ],
      [
        'value'        => 'lastedit',
        'text'         => 'Last Edit'
      ],
      [
        'value'        => 'votes',
        'text'         => 'Votes'
      ],
      [
        'value'        => 'reports',
        'text'         => 'Reports'
      ],
      [
        'value'        => 'public',
        'text'         => 'Public'
      ]
    ];

    if (!$sortkey /*|| !isset($this->sort_options[$sortkey])*/)
    {
      $sortkey = 'lastedit';
    }

    $this->sort_active = $sortkey;
  }

  /**
   * My Stories ajax component (used in Study > My Stories and Profile).
   * 
   * @return 
   */
  public function executeMyStoriesTable($request)
  {
    $tron = new JsTron();

    // throttle ajax requests
    $throttler = new RequestThrottler($this->getUser(), 'sharedstories');
    $throttler->setInterval(1);
    if (!$throttler->isValid())
    {
      $throttler->setTimeout();

      $tron->setError('<p>Please allow at least one second when paging through the stories. This '.
                      'helps us improve the website response time of the Study pages. Thanks! =)</p>');
      $tron->setStatus(JsTron::STATUS_FAILED);

      return $tron->renderJson($this);
    }
    $throttler->setTimeout();

    if (0 === ($stories_uid = (int)$request->getParameter('stories_uid', 0)))
    {
      $tron->setStatus(JsTron::STATUS_FAILED);
      return $tron->renderJson($this);
    }

    $profile_page = !!$request->getParameter('profile_page', false);

    return $tron->renderComponent($this, 'study', 'MyStoriesTable', ['stories_uid' => $stories_uid, 'profile_page' => $profile_page]);
  }

  /**
   * EditStory Vue ajax handler.
   * 
   * Request parameters:
   * 
   *   ucsCode            number
   *   
   *   reviewMode         boolean    True if used from the Review page EditStory window.
   *   
   *   postStoryEdit      string
   *   postStoryPublic    boolean
   * 
   * See study/edit action (parameters) and EditStoryDialog.js
   *
   * @return 
   */
  public function executeEditstory($request)
  {
    // FIXME - temporary compat. with AjaxDialog (YUI2 Connect) in Flashcard Review page
    if ($request->hasParameter('ucsCode'))  {
      // pretend we received application/json in POST body
      $json = (object) [
        'ucsCode'   => $request->getParameter('ucsCode'),
        'reviewMode' => true
      ];
    }
    else {
      $json = $request->getContentJson();
    }

    $tron = new JsTron();

    //
    $userId     = $this->getUser()->getUserId();
    $ucsId      = rtkValidators::sanitizeCJKUnifiedUCS($json->ucsCode);
    $reviewMode = (bool) $json->reviewMode;

    //
    $storedStory = StoriesPeer::getStory($userId, $ucsId);
    $storyCurrentlyShared = $storedStory && (bool)$storedStory->public;

    // for the AjaxDialog (legacy code)
    if ($reviewMode) {
      $tron->setStatus(JsTron::STATUS_PROGRESS);
      $tron->add( ['dialogTitle' => 'Edit Story'] );
    }

    if ($request->getMethod() === sfRequest::GET)
    {
      $postStoryEdit = ($storedStory ? $storedStory->text : '');

      // STATE (load state for the "Edit Story" Vue comp in flashcard page)
      $tron->add([
        'initStoryEdit'   => $postStoryEdit,
        'initStoryPublic' => (bool) ($storedStory && $storedStory->public)
      ]);

      // Flashcard Review page feayure -- get "favorite" story, if user's edit story is empty
      if (!$storedStory && $reviewMode)
      {
        if (false !== ($favStory = StoriesPeer::getFavouriteStory($userId, $ucsId)))
        {
          // the "favorite" story to format
          $postStoryEdit = $favStory->text;

          // the user's own story is empty, if editing
          $tron->set('initStoryEdit', '');
          $tron->set('initFavoriteStory', true);
        }
      }
    }
    else
    {
      // STATE
      $postStoryEdit   = trim($json->postStoryEdit);
      $postStoryPublic = (bool) $json->postStoryPublic;

      // disallow markup
      if ($postStoryEdit !== strip_tags($postStoryEdit)) {
        $tron->setError('HTML markup (tags) formatting not allowed in stories.');
        return $tron->renderJson($this);
      }
  // $this->forward404();
      
      // validate kanji links within story
      if (true !== ($errorMsg = rtkStory::validateKanjiLinks($postStoryEdit))) {
        $tron->setError($errorMsg);
        return $tron->renderJson($this);
      }

      // delete story if empty text
      if (empty($postStoryEdit))
      {
        StoriesPeer::deleteStory($userId, $ucsId);
        $postStoryEdit = '';
      }
      else
      // update story
      {
        // validate story length BEFORE substitutions (to match "x chars left" feedback on the client side)
        mb_internal_encoding('utf-8');
        $count = mb_strlen($postStoryEdit);
        if ($count > rtkStory::MAXIMUM_STORY_LENGTH) {
          $n = $count - rtkStory::MAXIMUM_STORY_LENGTH;
          $tron->setError(sprintf('Story is too long (512 characters maximum, %d over the limit).', $n));
          return $tron->renderJson($this);
        }

        // NOTE! it's assumed kanji substitution makes the story SMALLER (eg. "{1000}" => "{類}")
        $postStoryEdit = rtkStory::substituteKanjiLinks($postStoryEdit);

        if (true !== StoriesPeer::updateStory($userId, $ucsId, ['text' => $postStoryEdit, 'public' => (int) $postStoryPublic]))
        {
          $tron->setError("Woops, the story couldn't be saved. Try again in a few moments.");
          return $tron->renderJson($this);
        }
      }
      
      // invalidate cache -- approx 7% of stories are public,
      //  so skipping cache invalidation is worthwhile if possible
// error_log(sprintf("public %d > %d", $storyCurrentlyShared, $postStoryPublic));
      if ($postStoryPublic || $storyCurrentlyShared) {
// error_log(sprintf("invalidating the cache"));
        StoriesSharedPeer::invalidateStoriesCache($ucsId);
      }

      if (!$reviewMode) {
        // these are used for visual feedback, adding or removing the story from Shared Stories list
        $isStoryShared = $postStoryEdit !== '' && $postStoryPublic;
        $tron->set('isStoryShared', $isStoryShared);
      
        $tron->set('sharedStoryId', "story-${userId}-${ucsId}");
        sfProjectConfiguration::getActive()->loadHelpers(['Tag', 'Url', 'Links']);
        $tron->set('sharedStoryAuthor', link_to_member($this->getUser()->getUserName()));
      }
    }

    // keyword to auto-format
    $kanjiData     = KanjisPeer::getKanjiByUCS($ucsId);
    $custKeyword   = CustkeywordsPeer::getCustomKeyword($userId, $ucsId);
    $formatKeyword = $custKeyword ?? $kanjiData->keyword;

    // initial load (from Flashcard Review's edit story dialog)
    $tron->add([
      'kanjiData'    => $kanjiData,
      'custKeyword'  => $custKeyword
    ]);

    // POST state
    $tron->add([
      'initStoryView' => StoriesPeer::getFormattedStory($postStoryEdit, $formatKeyword, true)
    ]);

// sleep(1);

    return $tron->renderJson($this);
  }

  /**
   * EditKeyword (ajax).
   *
   * Request parameters:
   *   int   id   UCS-2 code.
   */
  public function executeEditkeyword($request)
  {
    $success = false;

    $ucsId = intval($request->getParameter('id'));

    // sanitize
    if (!BaseValidators::validateInteger($ucsId))
    {
      throw new rtkAjaxException('Bad request.');
    }

    // filter disallowed characters
    if (!CJK::isCJKUnifiedUCS($ucsId) || false === ($chardata = KanjisPeer::getKanjiByUCS($ucsId)))
    {
      throw new rtkAjaxException('Invalid character.');
    }
    
    $custom_keyword = CustkeywordsPeer::getCustomKeyword($this->getUser()->getUserId(), $chardata->ucs_id);

    $tron = new JsTron();
    $tron->add([
      'dialogWidth'   => 387,
      'dialogTitle'   => 'Customize Keyword for '.$chardata->kanji,
      'orig_keyword'  => $chardata->keyword,
      'cust_keyword'  => $custom_keyword
    ]);
    $tron->setStatus(JsTron::STATUS_PROGRESS);

    if ($request->getMethod() !== sfRequest::POST)
    {

    }
    else
    {
      mb_internal_encoding('utf-8');

      $keyword         = trim($request->getParameter('keyword', ''));
      $default_keyword = $chardata->keyword;

      // let empty keyword revert to the default
      if ($keyword === '') {
        $keyword = $default_keyword;
      }

      if (0 === strcmp($keyword, $default_keyword))
      {
        // delete the custom keyword
        if (CustkeywordsPeer::deleteCustomKeyword($this->getUser()->getUserId(), $ucsId))
        {
          $keyword = $default_keyword;
          $success = true;
        }
      }
      else if (rtkImportKeywords::validateKeyword($keyword, $request))
      {
        // update keyword
        if (CustkeywordsPeer::updateCustomKeyword($this->getUser()->getUserId(), $ucsId, $keyword))
        {
          $success = true;
        }
        else
        {
          $request->setError('x', 'Update error.');
        }
      }
    
      // success response with edited keyword, and flag for chain editing
      if (true === $success)
      {
        $tron = new JsTron();
        $tron->setStatus(JsTron::STATUS_SUCCESS);
        $tron->set('keyword', $keyword);
          
        // chain editing
        if ($request->hasParameter('doNext'))
        {
          $tron->set('next', true);
        }

        return $tron->renderJson($this);
      }
    }

    return $tron->renderPartial($this, 'EditKeyword', [
      'ucs_id'       => $chardata->ucs_id,
      'keyword'      => $custom_keyword !== null ? $custom_keyword : $chardata->keyword,
      'orig_keyword' => $chardata->keyword
    ]);
  }

  /**
   * Ajax handler for Shared Stories component.
   * 
   * Post:
   * 
   *   request     "star": star story
   *               "report": report story
   *               "copy": copy story
   *   uid         Story author's userid
   *   sid         Story id (kanji's UCS-2 code value)
   * 
   * @return 
   */
  public function executeAjax($request)
  {
    $json = $request->getContentJson();

    // request parameters
    $sRequest   = $json->request;
    $sUid       = BaseValidators::sanitizeInteger($json->uid);
    $sSid       = BaseValidators::sanitizeInteger($json->sid);

    // $this->forward404Unless(preg_match('/^(star|report|copy)$/', $sRequest));

    if ($sRequest === 'copy')
    {
      // get unformatted story with original tags for copy story feature
      $oStory = StoriesPeer::getStory($sUid, $sSid);
      if ($oStory)
      {
        StoriesPeer::useOldStoriesFix();
        $tron = new JsTron([
          'storyText' => rtxIndexOldStoriesFix::fixOldStoriesKanjiLinks($oStory->text)
        ]);
        return $tron->renderJson($this);
      }
    }
    elseif ($sRequest === 'star' || $sRequest === 'report')
    {
      // [ uid, sid, vote, lastvote, stars, kicks ]
      $params = (array) StoryVotesPeer::voteStory($this->getUser()->getUserId(), $sUid, $sSid, $sRequest === 'star');
      $tron = new JsTron($params);
      return $tron->renderJson($this);
    }
    
    throw new rtkAjaxException('Badrequest');
  }

  /**
   * Ajax handler for Dictionary Lookup feature.
   * 
   * JSON request:
   *
   *   ucs               UCS-2 code of the character to lookup.
   *   reqKnownKanji   (OPTIONAL) Also return a string of known kanji
   *
   * Returns:
   *
   *   items             Array of vocab entries (compound, reading, etc)
   *   picks             Array of user's selected vocab ([dictid, ...])
   *   knownKanji       (IF "reqKnownKanji") String of known kanji 
   *
   */
  public function executeDict($request)
  {
    $json = $request->getParamsAsJson();
// DBG::printr($json);exit;
    
    $ucsId = rtkValidators::sanitizeCJKUnifiedUCS($json->ucs);

    $tron   = new JsTron();
    $userId = $this->getUser()->getUserId();

    $tron->set('items', $this->getDictListItems($ucsId));
    $tron->set('picks', VocabPicksPeer::getUserPicks($userId, $ucsId));

    if (true === $json->reqKnownKanji) {
      $tron->set('knownKanji', $this->getUser()->getUserKnownKanji());
    }
// sleep(1);
    return $tron->renderJson($this);
  }

  // get Dictionary entries for given character, use cached data if possible
  private function getDictListItems($ucsId)
  {
    $data = [];

    $DictEntryArray = CacheDictLookupPeer::getDictListForUCS($ucsId);

    // use the slower method if no cached results (ie. not a RTK kanji)
    if (false === $DictEntryArray) {
      // error_log("Not Dict Cache for UCS {$ucsId}");
      $select = rtkLabs::getSelectForDictStudy($ucsId);
      $DictEntryArray = sfProjectConfiguration::getActive()->getDatabase()->fetchAll($select);
    }

    return $DictEntryArray;
  }

  /**
   * User selected a vocab entry in DictList component (could be study or review page).
   * 
   * JSON request:
   *
   *   ucs               UCS-2 code of associated character
   *   dictid            JMDICT entseq id
   *
   * Returns:
   *
   */
  public function executeVocabpick($request)
  {
    $json = $request->getContentJson();

    $ucsId  = rtkValidators::sanitizeCJKUnifiedUCS($json->ucs);
    $dictId = BaseValidators::sanitizeInteger($json->dictid);

    $userId = $this->getUser()->getUserId();

    $tron = new JsTron();

    if (true !== VocabPicksPeer::link($userId, $ucsId, $dictId)) {
      $tron->setError('Oops, update failed.');
      $tron->setStatus(JsTron::STATUS_FAILED);
    }
// sleep(1);

    return $tron->renderJson($this);
  }

  public function executeVocabdelete($request)
  {
    $json = $request->getContentJson();

    $ucsId  = rtkValidators::sanitizeCJKUnifiedUCS($json->ucs);

    $userId = $this->getUser()->getUserId();

    $tron = new JsTron();

    if (true !== VocabPicksPeer::unlink($userId, $ucsId /*, $dictId*/)) {
      $tron->setError('Oops, delete failed.');
      $tron->setStatus(JsTron::STATUS_FAILED);
    }
// sleep(1);

    return $tron->renderJson($this);
  }
}

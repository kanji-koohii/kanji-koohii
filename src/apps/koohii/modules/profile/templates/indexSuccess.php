<?php
  use_helper('Widgets', 'Date', 'SimpleDate');
  $sf_request->setParameter('_homeFooter', true);

  $profile_uid = $profile_user->userid;

  $num_stories = StoriesPeer::getStoriesCounts($profile_uid);
?>

  <h2><?php echo escape_once($profile_user->username) ?><span>'s public profile</span></h2>

  <h3>Activity</h3>

  <table cellspacing="0" class="blocky">
    <tr><th>Stories</th>
        <td><strong><?php echo $num_stories->total ?></strong> (<?php echo $num_stories->public ?> public,
        <?php echo $num_stories->private ?> private)</td>
    </tr>
    <tr><th>Kanji Flashcards</th><td><strong><?php echo ReviewsPeer::getFlashcardCount($profile_uid).'</strong> ('. ReviewsPeer::getReviewedFlashcardCount($profile_uid). ' reviewed)';
    ?></td></tr>
    <tr><th>Total Reviews</th><td><?php echo ReviewsPeer::getTotalReviews($profile_uid) ?></td></tr>
    <tr><th>Joined</th><td><?php echo date('j M Y', $profile_user->ts_joindate) ?></td></tr>
    <tr><th>Last Login</th><td><?php echo time_ago_in_words($profile_user->ts_lastlogin, true) ?> ago</td></tr>
  </table>

  <br/>
  <h3>Shared Stories</h3>

<?php if ($num_stories->public <= 0): ?>

   <p>This user has not made their stories public.</p>

<?php elseif ($sf_user->isAuthenticated()): ?>

  <p><strong><?php echo $num_stories->public ?></strong> stories have been shared by <?php echo escape_once($profile_user->username) ?>.

  <div id="ProfileStoriesComponent">
    <?php include_component('study', 'MyStoriesTable', ['stories_uid' => $profile_uid, 'profile_page' => true]) ?>
  </div>

  <?php koohii_onload_slot() ?>
      new Koohii.UX.AjaxTable('ProfileStoriesComponent' , { errorDiv: 'MyStoriesTableError' });
  <?php end_slot() ?>

<?php else: ?>

  <div class="warningmessagebox">
    Please sign in to view the user's shared stories.
  </div>

<?php endif ?>


<?php
  $sf_request->setParameter('_homeFooter', true);
?>

    <h2>Members reviewing in the past 30 days</h2>

    <p> On this page you can see the activity and progress of your friends and members of the Kanji Koohii community.
        Please note that this table only includes members who use this site's SRS
        (Spaced Repetition System) and flashcards.</p>

    <div id="MembersListComponent">
      <?php include_component('home', 'MembersList') ?>
    </div>

</div>

<?php koohii_onload_slot() ?>
  var ajaxTable = new Koohii.UX.AjaxTable('MembersListComponent');
<?php end_slot() ?>

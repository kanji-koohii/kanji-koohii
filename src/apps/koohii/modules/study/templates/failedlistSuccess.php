<?php
  $restudyCount = ReviewsPeer::getRestudyKanjiCount($sf_user->getUserId());
?>

  <h2>Restudy List</h2>

  <div class="row">
    <div class="col-md-6">
      <p>Pick a kanji from the list to restudy or go straight to review.</p> 

<?php if ($restudyCount > 20): ?>
      <h3>Using the "learned" pile</h3>
      <p>If you have a lot of failed cards, you might want to review it in small batches as you work on them.
       
        To do this, use the "Learned" button on the Study pages, then review the learned pile from there.
         </p>
<?php endif ?>
    </div>

    <div class="col-md-6">
      <div class="" style="margin:0 0 1.5em;">

<?php if ($restudyCount > 0): ?>

        <?php //echo _bs_button_with_icon('Review forgotten cards', '@review', array('query_string' => 'box=1', 'icon' => 'fa-play')) ?>
        <?php echo _bs_button("<strong>$restudyCount</strong> failed cards (review)", '@review', ['query_string' => 'box=1',
          'class' => 'btn btn-lg btn-srs btn-failed', 'icon' => 'fa-play']) ?>
<?php else: ?>

        <button type="button" class="btn btn-success" disabled="disabled">You have no failed kanji cards!</button>

<?php endif ?>

      </div>
    </div>

  </div>

  <div id="FailedListTable">
    <?php include_component('study', 'FailedListTable') ?>
  </div>

<?php koohii_onload_slot() ?>
  new Koohii.UX.AjaxTable('FailedListTable');
<?php end_slot() ?>


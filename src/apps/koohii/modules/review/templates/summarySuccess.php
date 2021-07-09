<?php use_helper('Widgets', 'Gadgets', 'CJK', 'Links') ?>
<?php $sRtKForumUrl = sfConfig::get('app_forum_url') ?>

<?php #DBG::request() ?>

  <h2>Review Summary</h2>

<div class="row">
  <div class="col-md-6 mb-8">
    <h3><?php echo $title ?></h3>

    <p>Below is the list of flashcards from your last review session.
    <?php if (!$fc_free): ?>Click the column titles to sort on frame number, keyword, etc.<?php endif ?></p>
<?php if (!$fc_free): ?>
    <p>See the <?php echo link_to('detailed flashcard list','manage/flashcardlist') ?> for a complete list of all your flashcards and past results.</p>
<?php endif ?>

<?php
    $go_back = $fc_free ? 'review/custom' : 'review/index';
    echo _bs_button('Back', $go_back, ['class' => 'btn btn-primary']);

    if ($fc_rept !== '') {
      echo '&nbsp;&nbsp;'._bs_button('Repeat Review', $fc_rept, ['absolute' => true, 'class' => 'btn btn-success']);
    }
?>
  </div>
  
  <div class="col-md-6">
<?php if ($numTotal > 0): ?>
    <div class="padded-box rounded">

      <?php echo ui_chart_vs([
        'valueLeft' => $numRemembered,
        'labelLeft' => 'Remembered',
        'valueRight' => $numForgotten,
        'labelRight' => 'Forgotten'
      ]) ?>

    </div>
<?php endif ?>

<?php if (count($deletedCards)): ?>
    <div id="FcSummaryDeld" class="padded-box rounded">
      <h3>Deleted flashcards <span>(<?php echo count($deletedCards) ?>)</span></h3>
      <p><?php echo cjk_lang_ja('&#'.implode(';&#', $deletedCards)) ?></p>
    </div>
<?php endif ?>

  </div>
</div><!-- /row -->

<div style="margin-top:2em;">

<?php if ($numTotal > 0): ?>
  <div id="summaryTable<?php echo $fc_free ? ' fcfree' : '' ?>">
    <?php if (!$fc_free) {
      include_component('review', 'summaryTable', ['ts_start' => $ts_start]);
    } else {
      include_component('review', 'summarySimple');
    } ?>
  </div>
<?php endif ?>

</div>

<?php koohii_onload_slot() ?>
  new Koohii.UX.AjaxTable('summaryTable');
<?php end_slot() ?>

<?php use_helper('CJK', 'Form', 'Widgets', 'Gadgets') ?>

<?php # Ajax loading indicator ?>
<div id="uiFcAjaxLoading" style="display:none"><i class="fa fa-spinner fa-spin"></i><span>Loading</span></div>

<?php # Connection timeout message ?>
<div id="uiFcAjaxError" style="display:none">
  <span class="uiFcAjaxError_msg">Oops!</span>&nbsp;&nbsp;<a href="#">Reconnect</a>
</div>

<?php # Fixes: Change Koohii Font script -- http://userscripts.org/scripts/show/6896 ?>
<div class="signin" style="display:none"><div class="m"><strong><?= $sf_user->getUsername() ?></strong></div></div>

<div id="uiFcOptions" class="uiFcOptions">
  <?= link_to('<span>Exit</span>', $exit_url, ['absolute' => 'true', 'class' => 'uiFcOptBtn uiFcOptBtnExit', 'title' => 'Exit flashcard review']) ?>
  <a href="#" id="JsBtnHelp" class="uiFcOptBtn uiFcOptBtnHelp uiFcAction" data-action="help" title="Shows help dialog."><span>Help</span></a>
  <a href="#" class="uiFcOptBtn uiFcOptBtnStory uiFcAction" data-action="story" title="View/Edit story for this flashcard"><span><u>S</u>tory</span></a>
  <a href="#" id="JsBtnDict" class="uiFcOptBtn uiFcOptBtnDict uiFcAction" data-action="dict" title="Dictionary lookup"><span><u>D</u>ict</span></a>
  
  <?= link_to('<span><u>U</u>ndo</span>', '', ['absolute' => 'true',
    'id'    => 'JsBtnUndo',
    'class' => 'uiFcOptBtn uiFcOptBtnUndo uiFcAction', 
    'title' => 'Go back one flashcard',
    'style' => 'display:none',
    'data-action' => 'undo']) ?>

  <div class="clear"></div>
</div>

<div id="JsFcHelpDlg" style="display:none">
  <div class="bd">
    <div class="uiFcHelpDlg body JSDialogClose">
      <h3>Keyboard Shortcuts</h3>

      <p><kbd>SPACE</kbd> or <kbd>F</kbd> or <kbd>Numpad 0</kbd> to flip card.</p>
      <p><kbd>N</kbd> <kbd>H</kbd> <kbd>Y</kbd> <kbd>E</kbd> for <strong>N</strong>o, <strong>H</strong>ard, <strong>Y</strong>es, <strong>E</strong>asy.</p>
      <p>... and <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> on the main keyboard.</p>
      <p>... and <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> on the numeric keypad.</p>
      <p><kbd>K</kbd> or <kbd>,</kbd> (numpad) to <strong>skip</strong> this card.</p>
      <p><kbd>S</kbd> to open/close the <strong>Edit Story</strong> window.</p>
      <p><kbd>D</kbd> to open/close the <strong>Dictionary</strong> window.</p>
      <p><kbd>U</kbd> to <strong>undo</strong> the last answer.</p>

    </div>
  </div>
</div>

<div id="fr-body">

  <div id="rd-tops">
    <div id="uiFcProgressBar">
      <div class="uiFcStBox">
        <div class="uiFcPrBarMod">
          <?= ui_progress_bar([['value' => 0]], 100, ['id' => 'review-progress', 'borderColor' => '#5FA2D0']) ?>
        </div>
        <h3>Reviewing: <em class="count">.</em> of <em class="count">.</em></h3>
      </div>
    </div>
  </div>

  <div id="rd-main">
    <div id="uiFcReview">

      <div id="uiFcMain">
        <!-- Vue flashcard component goes here -->
      </div>

      <div class="uiFcButtons" id="uiFcButtons">
        
        <div id="uiFcButtons0" style="display:none">
          <h3>Press Spacebar or F to flip card</h3>
          <?php #echo ui_ibtn('<u>F</u>lip Card', $routename, array('id' => 'uiFcBtnAF', 'class' => 'uiFcAction', 'data-action' => 'flip')) ?>
          <a href="#" id="uiFcBtnAF" class="uiIBtn uiIBtnDefault uiFcAction" data-action="flip"><span><u>F</u>lip Card</span></a>
        </div>
    
        <div id="uiFcButtons1"<?= $freemode ? '' : ' class="three-buttons"'; ?> style="display:none">
          <h3>Do you remember this <?= _CJ('kanji') ?>?</h3>
          <?php 
echo ui_ibtn('<u>N</u>o', '', ['id' => 'uiFcBtnAN', 'class' => 'uiIBtnRed uiFcAction', 'data-action' => 'no', 'title' => 'Forgotten']);
if (!$freemode) {
echo ui_ibtn('<u>H</u>ard', '', ['id' => 'uiFcBtnAH', 'class' => 'uiIBtnOrange uiFcAction', 'data-action' => 'hard', 'title' => 'Hard']);
}
echo ui_ibtn('<u>Y</u>es', '', ['id' => 'uiFcBtnAY', 'class' => 'uiFcAction', 'data-action' => 'yes', 'title' => 'Remembered with some effort']);
if (!$freemode) {
  echo ui_ibtn('<u>E</u>asy', '', ['id' => 'uiFcBtnAE', 'class' => 'uiFcAction', 'data-action' => 'easy', 'title' => 'Remembered easily']);
}
          ?>
          <div class="clear"></div>
        </div>
        
      </div><!-- uiFcButtons -->
    </div><!-- uiFcReview -->
  </div><!-- rd-main -->


  <?php # Stats panel (displays when first card is loaded) ?>
  <div id="rd-side">
    <div id="uiFcStats" class="uiFcStats" style="display:none">

      <div id="uiFcPiles" class="stacks">
        <div class="td stack" title="Cards remembered"><i class="fa fa-check"></i><span class="JsPass">0</span></div>
        <div class="td stack" title="Cards forgotten"><i class="fa fa-times"></i><span class="JsFail">0</span></div>
      </div>
      
      <div id="uiFcEnd" class="">
        <a href="#" class="uiFcStBox JsFinish uiFcAction" data-action="end" title="Finish - go to review summary">End</a>
      </div>

  <div class="clear"></div>

      <div id="uiFcStDeld" class="uiFcStBox" style="display:none">
        <h3>Deleted: <em class="count">0</em></h3>
        <p id="uiFcStDeldK"><?= cjk_lang_ja('&nbsp;') ?></p>
      </div>

    </div><!-- uiFcStats -->    
  </div>

  <div class="clear"></div>
</div><!-- fr-body -->

<?php # Form to redirect to Review Summary with POST ?>
<form method="post" id="uiFcRedirectForm" action="<?= url_for('@review_summary') ?>" style="display:none">
  <?php # Custom data to pass to the Review Summary (review.js onEndReview()) ?>
  <?= input_hidden_tag('ts_start', $ts_start) ?>
  <input type="hidden" name="fc_pass" value="0" />
  <input type="hidden" name="fc_fail" value="0" />
  <input type="hidden" name="fc_deld" value="0" />
  <input type="hidden" name="fc_free" value="<?= (int)$freemode ?>" />
<?php if ($freemode): ?>
  <input type="hidden" name="fc_rept" value="<?= $fc_rept ?>" />
<?php endif ?>
</form>

<div id="mobile-debug" style="padding:20px 0 0;"></div>

<?php
  $reviewOptions = [
    'end_url' =>  url_for('@review_summary', true),
    'editstory_url' => url_for('study/editstory'),
    'dictlookup_url' => url_for('study/dict'),

    'fcr_options' => [
      //num_prefetch: 10,
      'ajax_url' => $ajax_url,
      'back_url' => url_for($exit_url, true),
      'items' => $items,
    ]
  ];

  // (wip) Vue refactoring
  $reviewMode = [
    'freemode' => $freemode,
    'fc_reverse' => $fc_reverse,
    'fc_view' => 'kanji',

    'fc_known_kanji' => $sf_user->getUserKnownKanji(),

    // (NOT freemode) edit flashcard menu
    'fc_edit_uri' => $sf_context->getController()->genUrl('flashcards/dialog'),
    'fc_edit_params' => ['review' => 1 ]
  ];

  kk_globals_put('REVIEW_OPTIONS', $reviewOptions);
  kk_globals_put('REVIEW_MODE', $reviewMode);


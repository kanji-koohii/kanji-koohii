<?php
  use_helper('Widgets');
?>

  <div id="srs-home_actions">
<?php
  if ($untested_cards > 0) {
    echo _bs_button("<strong>$untested_cards</strong> new", '@review', [
      'class' => 'btn btn-lg btn-srs btn-new',
      'query_string' => $me->getQueryString(['type' => 'untested'])
    ]);
  }

  if ($expired_total > 0) {
    echo _bs_button("<strong>$expired_total</strong> due", '@review', [
      'class' => 'btn btn-lg btn-srs btn-due',
      'query_string' => $me->getQueryString(['type' => 'expired'])
    ]);
  }

  if ($restudy_cards > 0) {
    echo _bs_button("<strong>$restudy_cards</strong> restudy", 'study/failedlist', [
      'class' => 'btn btn-lg btn-srs btn-failed'
    ]);
  }
?>
    <div class="clear"></div>
  </div>

  <div class="clear"></div>

  <div id="leitner-chart_pane" class="min-h-[268px] md:min-h-[298px] p-4 bg-[#e7e1d3] no-gutter-xs-sm">
    <!-- Vue goes here -->
  </div>

<?php
  kk_globals_put('LEITNER_CHART_DATA', $leitner_chart_data);
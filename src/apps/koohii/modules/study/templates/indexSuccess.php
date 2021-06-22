<?php
  $this->latestKanji = ReviewsPeer::getHeisigProgressCount($sf_user->getUserId());
?>
<div class="row">

  <?php include_partial('SideColumn', ['kanjiData' => false, 'intro' => true /* <- could be "false" */ ]) ?>

  <div class="col-md-9">
    <?php include_partial('study/StudyIntro', array('latestKanji' => $this->latestKanji)) ?>
  </div>

</div>
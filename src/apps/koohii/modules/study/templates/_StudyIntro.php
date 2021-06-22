<?php use_helper('Widgets') ?>
<?php slot('inline_styles') ?>
.fmt { color:#262; font-weight:bold; font-family:"Courier New"; }
<?php end_slot() ?>

  <h2>A Quick Tour</h2>

  <p> The Study area is where you can browse the <?php echo _CJ('kanji') ?>, edit your stories, and
    share your best stories (mnemonics) with other members.
  </p>
  <p><?php echo ui_ibtn('Start with '._CJ('kanji').'  #1', '@study_edit?id=1') ?> ... or <strong>enter a number/keyword in the search box</strong>!</p>
  <p><?php 
    if($latestKanji > 0) {
      echo ui_ibtn('Continue from '._CJ('kanji').'  #'.($latestKanji+1), '@study_edit?id='.($latestKanji+1));
    }
  ?></p>
<h3>Searching</h3>

  <p>You can <strong>search</strong> characters and associated stories by entering: a frame number, a keyword, or the
    character itself. The Study page cover many more characters which you can access by
    entering their decimal unicode value.
  </p>

<h3>Restudy List</h3>
  <p>
    When you fail a flashcard review, the cards go to the red pile. They show up (in frame number order) in the
    sidebar's "Restudy" section. As you work through these characters, click the <strong>Add to learned list</strong>
    button. After re-learning a number of characters, click the "Review" button in the sidebar. The characters
    that pass the test will re-enter the SRS cycle, and the cards that failed the test remain in the red pile.
  </p>

<h3>Sharing stories</h3>

  <p> <strong>Stories</strong> are detailed mnemonics, such as those that James Heisig provides in the
    first chapters of the book. Please note the difference between a mnemonic and a story !
    Mnemonics are little more than a list of primitives and will generally make sense only
    to the person who created them. Try to flesh out the mnemonics into a mini story. What makes
    stories effective is the linking of the primitives (character constituents) into a mental
    image and/or a series of events. Stories do not have to make any sense! However it is
    important for a good story, that it captures the particular meaning of the keyword.
  </p>

<h3>Special Formatting</h3>
  <p> <strong>Keywords</strong> are automatically highlighted in stories and displayed in a <strong>bold</strong> type.
    If the keyword is spelled differently, enclose the keyword with hashes, <span class="fmt">#like this#</span>.
  </p>
  <p> <strong>Primitives</strong> can be formatted in your stories by enclosing them with the star character
    <span class="fmt">*like this*</span>. They will then appear <i>italicized</i>.
  </p>
  <p> <strong>Links to characters</strong> can be used in stories by enclosing a frame number or character
    with braces. For example <span class="fmt">{113}</span> or <span class="fmt">{山}</span>. A decimal unicode value can also be used
    for example <span class="fmt">{40701}</span> will substitute into <?php echo link_to('黽', 'study/edit?id=黽') ?>.
  </p>

<h3>Note about copyright</h3>
  <p> Please remember that the original stories appearing in <?php echo _CJ('Remembering the Kanji') ?> are copyrighted, and <strong>SHOULD NOT BE REPRODUCED</strong> on the website!
     (you can of course enter them for your own use, as long as they are private)
  </p>

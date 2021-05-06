<?php
/**
 * Encode url and text for Twitter buttons.
 *
 *   https://twitter.com/intent/tweet?url={url}&amp;text={text}
 */
function koohii_tweet_query() {
  return http_build_query(['url' => sfConfig::get('app_website_url'), 'text' => 'Kanji Koohii']);
}

use_helper('Widgets');
?>

<footer id="footer">
  <div class="transition"></div>
  <div class="k_bg_free">
    <div class="container">
      <section>
<p>Made in Belgium since 2006 by&nbsp;Fabrice.</p>
<?php if ($sf_user->isAuthenticated() && null === sfConfig::get('app_fork')): ?>
<p><strong>Support my work</strong> with <?php echo link_to('Patreon, PayPal', 'about/support') ?>, <span class="break">and affiliate <?php use_helper('__Sponsor'); echo link_to_jpod101('JapanesePod101.com') ?>.</span></p>
<?php endif ?>

<ul>
  <li><?php echo link_to('<i class="fa fa-comment"></i>Blog','news/index')
?></li><li><?php echo link_to('<i class="fa fa-envelope"></i>Contact', '@contact')
?></li><li class="ne"><?php echo link_to('<i class="fa fa-question"></i>About', 'about/index') ?>
  <li><a href="https://github.com/fabd/kanji-koohii"><i class="fa fa-code-branch"></i>Source Code</a></li>
</ul>
      </section>
    </div>
  </div>
</footer>

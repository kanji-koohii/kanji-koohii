<!DOCTYPE html>
<html>
<head>
<?php include_http_metas() ?>
  <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1, minimum-scale=1, maximum-scale=1">
<?php include_metas() ?>
<?php if (CORE_ENVIRONMENT === 'staging') { echo '<meta name="robots" content="noindex, nofollow" />'."\n"; } ?>
<?php include_title() ?>
  <link rel="alternate" type="application/rss+xml" title="RSS" href="rss">
<?php 
  $pageId      = $sf_request->getParameter('module').'-'.$sf_request->getParameter('action');
  $isLandingPage = $sf_request->getParameter('isLandingPage');
  $withFooter  = $sf_request->getParameter('_homeFooter') ? 'with-footer ' : '';

  // call it here at last, if it wasn't already triggered via view.yml (addJavascript())
  $sf_response->addViteEntries();

  include_stylesheets();
  include_javascripts();
?>
  <link href="https://use.fontawesome.com/releases/v5.0.1/css/all.css" rel="stylesheet">

  <!-- thx realfavicongenerator.net -->
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png?v=20170121">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png?v=20170121">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png?v=20170121">
  <link rel="manifest" href="/favicons/site.webmanifest?v=20170121">
  <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg?v=20170121" color="#deb214">
  <link rel="shortcut icon" href="/favicons/favicon.ico?v=20170121">
  <meta name="apple-mobile-web-app-title" content="Koohii">
  <meta name="application-name" content="Koohii">
  <meta name="msapplication-TileColor" content="#f8c5e3">
  <meta name="msapplication-TileImage" content="/favicons/mstile-144x144.png?v=20170121">
  <meta name="msapplication-config" content="/favicons/browserconfig.xml?v=20170121">
  <meta name="theme-color" content="#f0ddd4">


<?php if(has_slot('inline_styles')): ?>
  <style type="text/css">
<?php include_slot('inline_styles') ?>
  </style>
<?php endif ?>
<?php if (KK_ENV_PROD) { use_helper('__Analytics'); /* async */ echo ga_tracking_code(); } ?>
</head>
<body
  class="<?php echo $withFooter ?>yui-skin-sam <?php $pageId = $sf_request->getParameter('module').'-'.$sf_request->getParameter('action'); echo $pageId; ?>">
  <div id="body-navbar-holder"></div>

<div id="aside-component"></div><!-- fabd : FIXME?? TS refactor Vue3 -->

<!--[if lt IE 9]><div id="ie"><![endif]--> 

<?php include_partial('global/navbar', ['pageId' => $pageId]) ?>

<?php if ($isLandingPage) {
  echo $sf_content;
} else { ?>
<div id="main">
  <div id="main_container" class="container">
<?php echo $sf_content ?>
  </div>
</div>
<?php if ($sf_request->getParameter('_homeFooter')) { include_partial('home/homeFooter'); } ?>
<?php } ?>

<?php kk_globals_out() ?>
<?php koohii_onload_slots_out() ?>

<script>
var koohii_nav_data = <?php echo json_encode(get_slot('koohii.nav.data'), /*JSON_PRETTY_PRINT |*/ JSON_UNESCAPED_SLASHES) ?>;

// (fabd) note javascript modules are deferred, and not yet available
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector('#k-slide-nav-btn').addEventListener("click", function() {
    Koohii.UX.KoohiiAside.open({
      navOptionsMenu: koohii_nav_data
    })
  })
});
</script>

<?php if (KK_ENV_DEV):  ?>
<script>
  // auto-collapse sf debug bar
  window.addEventListener("load", function(ev){
    if (typeof sfWebDebugToggleMenu !== "undefined") {
      sfWebDebugToggleMenu();
    }
  });
</script>
<?php endif ?>


<!--[if IE]></div><![endif]--> 

<div id="__debug_log"></div>
<?php if ($sf_user->getUserName() === 'fuaburisu' || $sf_user->isAdministrator()) {
  $_pc = sfProjectConfiguration::getActive();
  $_db = $_pc->getDatabase();
  if ($_db->getProfiler()) { echo $_db->getProfiler()->getDebugLog(); }
  echo '<div style="background:#fff;font:15px/1em Arial;padding:5px 10px;text-align:right;overflow:hidden;">'.$_pc->getAdminInfoFooter().'</div>';
} ?>

<?php /*
  <div id="footer">
    <p>
    <?php echo link_to('home', '@homepage') ?>&nbsp;|
    <?php echo link_to('about', 'about/index') ?>&nbsp;|
    <?php echo link_to('contact', '@contact') ?>&nbsp;|
    User contributions licensed under <?php echo link_to('CC-BY-SA-NC', 'http://creativecommons.org/licenses/by-nc-sa/3.0/') ?> <?php echo link_to('with attribution', 'about/license') ?>
    |&nbsp;<span id="dbgtime"><?php echo sfProjectConfiguration::getActive()->profileEnd() ?>s</span>
    </p>
  </div>
*/ ?>

</body>
</html>

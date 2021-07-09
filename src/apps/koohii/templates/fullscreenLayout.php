<!DOCTYPE html>
<html>
<head>
<?php include_http_metas(); ?>
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php include_metas(); ?>
<?php include_title(); ?>
<?php
  // temporary (fix dirty js inclusions from labs mode later)
  $pageId = $sf_request->getParameter('module').'-'.$sf_request->getParameter('action');
  $isLandingPage = $sf_request->getParameter('isLandingPage');

  $sf_response->addViteEntries();

  include_stylesheets();
  include_javascripts();
?>
  <link href="https://use.fontawesome.com/releases/v5.0.1/css/all.css" rel="stylesheet">

  <!-- thx realfavicongenerator.net -->
  <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png?v=20170121b">
  <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png?v=20170121" sizes="32x32">
  <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png?v=20170121" sizes="16x16">
  <link rel="manifest" href="/favicons/manifest.json?v=20170121">
  <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg?v=20170121" color="#deb214">
  <link rel="shortcut icon" href="/favicons/favicon.ico?v=20170121">
  <meta name="apple-mobile-web-app-title" content="Koohii">
  <meta name="application-name" content="Koohii">
  <meta name="msapplication-TileColor" content="#f8c5e3">
  <meta name="msapplication-TileImage" content="/favicons/mstile-144x144.png?v=20170121">
  <meta name="msapplication-config" content="/favicons/browserconfig.xml?v=20170121">
  <meta name="theme-color" content="#f0ddd4"></head>

  <style type="text/css">
/* FIXME! put this in a stylesheet, add a class to the body? */
body { padding-top:0;  }
  </style>

<?php if (has_slot('inline_styles')) { ?>
  <style type="text/css">
<?php include_slot('inline_styles'); ?>
  </style>
<?php } ?>

</head>
<body class="uiFcLayout yui-skin-sam">

<?php echo $sf_content; ?>

<?php kk_globals_out() ?>
<?php koohii_onload_slots_out() ?>

</body>
</html>

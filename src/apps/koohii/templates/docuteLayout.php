<!DOCTYPE html>
<html>
<head>
<?php include_http_metas() ?>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
<?php include_metas() ?>
<?php include_title() ?>
  <!-- the docute client styles -->
<?php 
  // $pageId = $sf_request->getParameter('module').'-'.$sf_request->getParameter('action');
  
  // reset default app css/js
  $sf_response->clearStylesheets();
  $sf_response->clearJavascripts();
?>
<?php include_stylesheets() ?>
  <link rel="stylesheet" href="https://unpkg.com/docute/dist/docute.css">
  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">

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

/* docute theme */
body {  }

h1, h2, h3, h4, h5 { color:#7f7d75; }
h2, h3 { color:#fa3d60; }
h4 { color:#42b983; }

.sidebar-toggle, .sidebar { background:#f8f8f8; }
.main { background:#fff; }

.sidebar { border-right:none; }

.markdown-body h4 {
  background: #efe;
  margin: 24px -30px 16px;
  padding: 16px 30px;
}

.markdown-body code { color:#fa3d60;  }
.markdown-body pre code { color:#444; }


<?php if(has_slot('inline_styles')): ?>
<?php include_slot('inline_styles') ?>
<?php endif ?>
  </style>
</head>
<body>

<?php echo $sf_content ?>

<div id="app"></div>

<!-- load the docute client library -->
<script src="https://unpkg.com/docute@3.4.12/dist/docute.js"></script>
  
<!-- bootstrap your docute app! -->
<script>
  docute.init(<?php echo get_slot('docute.init') ?>);
</script>

</body>
</html>
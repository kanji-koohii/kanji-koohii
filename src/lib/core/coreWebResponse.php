<?php
/**
 * Extend the response object with versioning of javascript and stylesheet files.
 */
class coreWebResponse extends sfWebResponse
{
  /**
   * Vite javascript assets require this.
   *
   * @see https://vitejs.dev/guide/#browser-support
   */
  const SCRIPT_TYPE_MODULE = ['type' => 'module'];

  /**
   * Vite dev server.
   */
  const VITE_SERVER = 'http://localhost:3000/';
  const VITE_CLIENT = '@vite/client';

  const USE_DEV_SERVER = true;

  public function addViteEntries()
  {
    static $viteClientLoaded = false;

    if ($viteClientLoaded)
    {
      return;
    }

    $request = sfContext::getInstance()->getRequest();

    // $module = $request->getParameter('module');
    // $action = $request->getParameter('action');

    $isLandingPage = $request->getParameter('isLandingPage');

    // FIXME : obsolete YUI2 dependency to be phased out
    if (!$isLandingPage)
    {
      $this->addJavascript('/vendor/yui2-build/index.min_v290.js', self::FIRST, ['defer' => true]);
    }

    if (self::USE_DEV_SERVER && false === $viteClientLoaded)
    {
      $this->addViteClient();
      $viteClientLoaded = true;
    }

    // common base entry for all authenticated pages
    if (!$isLandingPage)
    {
      $this->addViteEntry('src/entry-study.ts');
    }
  }

  public function addViteClient()
  {
    $this->addJavascript(self::VITE_SERVER.self::VITE_CLIENT, self::FIRST, self::SCRIPT_TYPE_MODULE);
  }

  /**
   * Adds javascript code to the current web response.
   *
   * @see  sfWebResponse::addJavascript()
   *
   * @param mixed $file
   * @param mixed $position
   * @param mixed $options
   */
  public function addJavascript($file, $position = '', $options = [])
  {
    if (strpos($file, 'src/') === 0)
    {
      // this adds Vite dependencies, when triggered early via adding an entry in view.yml
      $this->addViteEntries();

      // typically this will be the last added entry for specific pages (after common entries)
      $this->addViteEntry($file, $position);
    }
    else
    {
      parent::addJavascript($file, $position, $options);
    }
  }

  public function addViteEntry($entryFile, string $position = '')
  {
    // with Vite's dev server, just import the entry file(s) which also include the CSS
    if (KK_ENV_DEV && self::USE_DEV_SERVER)
    {
      $this->addJavascript(self::VITE_SERVER.$entryFile, $position, self::SCRIPT_TYPE_MODULE);

      return;
    }

    // from this point, add javascripts & stylesheets based on deps in manifest file
    //

    $manifest = $this->getViteManifest();

    $entryInfo = $manifest[$entryFile] ?? [];
    assert(!empty($entryInfo), sprintf("addViteEntry() : entry file not in manifest? '%s'", $entryFile));

    $position = '';

    $addViteDist = function ($assetFile)
    {
      return Vite::OUTDIR.'/'.$assetFile;
    };

    // add imports
    if (null !== ($deps = $manifest[$entryFile]['deps'] ?? null))
    {
      foreach ($deps as $importFile)
      {
        $this->addJavascript($addViteDist($importFile), $position, self::SCRIPT_TYPE_MODULE);
      }
    }

    // add entry file itself
    $importFile = $entryInfo['file'];
    $this->addJavascript($addViteDist($importFile), $position, self::SCRIPT_TYPE_MODULE);

    // add stylesheet(s) if any
    if ($cssDeps = $entryInfo['css'])
    {
      foreach ($cssDeps as $importFile)
      {
        $this->addStylesheet($addViteDist($importFile), $position);
      }
    }
  }

  protected function getViteManifest()
  {
    static $viteManifest = null;

    if (null === $viteManifest)
    {
      // in dev, grab the manifest.json which is updated in real time by `vite build --watch`
      if (KK_ENV_DEV)
      {
        $viteManifest = Vite::getManifestJson();
      }
      // in test/prod, use the one we pre-parsed to php array
      else
      {
        $viteManifest = require_once sfConfig::get('sf_config_dir').'/vite-build.inc.php';
      }
    }

    return $viteManifest;
  }

  /**
   * Sets response headers for a text response that can be saved
   * as a file by the user. This is useful for exporting data.
   *
   * @param string $fileName Filename proposed by the browser when the text response is returned
   */
  public function setFileAttachmentHeaders($fileName)
  {
    // set text mode for the data export
    $this->setContentType('text/plain; charset=utf-8');

    // disable cache and set file attachment name
    $this->setHttpHeader('Cache-Control', 'no-cache, must-revalidate');
    $this->setHttpHeader('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT');
    $this->setHttpHeader('Content-Disposition', 'attachment; filename="'.$fileName.'"');
  }
}

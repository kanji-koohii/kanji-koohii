<?php
/**
 * Helpers to handle front-end assets built with Vite.
 */

class Vite
{
  /**
   * Matches vite config `outDir` (ie. /abs/path inside www folder to Vite build)
   */
  const OUTDIR = '/build/dist';

  public static function getManifestJson()
  {
    $file = sfConfig::get('sf_web_dir').self::OUTDIR.'/manifest.json';

    if (false === ($text = file_get_contents($file)))
    {
      throw new sfException(sprintf('Could not read manifest file "%s".', $file));
    }

    if (null === ($manifest = json_decode($text, true)))
    {
      throw new sfException(sprintf('Error parsing JSON in "%s".', $file));
    }

    $deps = [];
    $entries = [];

    $parseChunk = function ($chunkInfo, array &$deps, array &$css) use (&$parseChunk, &$manifest)
    {
      // recurse into the dependencies first
      $imports = $chunkInfo['imports'] ?? [];
      foreach ($imports as $importChunk)
      {
        $deps[] = $parseChunk($manifest[$importChunk], $deps, $css);
      }

      // add the chunk's main file
      $entryFile = $chunkInfo['file'] ?? '-ERROR-';

      // add stylesheets
      $styles = $chunkInfo['css'] ?? [];
      foreach ($styles as $cssFile)
      {
        $css[] = $cssFile;
      }

// DBG::out(' return entryfile '.$entryFile);
      return $entryFile;
    };

    foreach ($manifest as $chunkName => $chunkInfo)
    {
      if (0 !== strpos($chunkName, '_'))
      {
        // [
        //   'file' => $manifest[$chunk]['file'],
        //   'deps' => $deps,
        //   'css' => $manifest[$chunk]['css'],
        // ];
        $deps = [];
        $css = [];
        $entryFile = $parseChunk($chunkInfo, $deps, $css);
        $entries[$chunkName] = [
          'file' => $entryFile,
          'deps' => array_unique($deps),
          'css' => array_unique($css),
        ];
      }
    }

    // echo "<pre>\n".print_r($entries, true)."</pre>"; exit;

    return $entries;
  }
}

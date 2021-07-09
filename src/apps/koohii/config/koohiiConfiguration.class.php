<?php

// disable SwiftMailer (cf. lib/vendor/symfony/lib/config/sfFactoryConfigHandler.class.php)
class Swift { }

class koohiiConfiguration extends sfApplicationConfiguration
{
  private
    $core_db,
    $profile_time = null;

  public function configure()
  {
    $this->profileStart();

    // because of sf cache:clear repeating this code??
    if (!defined('CORE_ENVIRONMENT'))
    {
      // FIXME .. refactor to sf
      define('CORE_ENVIRONMENT', $this->getEnvironment());

      //
      define('KK_ENV_DEV', CORE_ENVIRONMENT === 'dev');
      define('KK_ENV_PROD', CORE_ENVIRONMENT === 'prod');

      // FIXME obsolete, clean up
      define('CJ_MODE', 'rtk');
      define('CJ_HANZI', false);
      // translate between kanji/hanzi sites, FIXME @obsolete
      function _CJ($sid) { return $sid; }
      // Return the string with first character uppercase. FIXME @obsolete
      function _CJ_U($sid) { return ucfirst(_CJ($sid)); }

      // autoloading of old Peer classes, ensures self::$db is always set
      require(sfConfig::get('sf_lib_dir').'/core/coreAutoload.php');
      coreAutoload::register();
    }

    // events
    $this->dispatcher->connect('flashcards.update', ['rtkUser', 'eventUpdateUserKnownKanji']);
  }

  /**
   * Retrieve a single instance of the MySQL database (old code).
   *
   * FIXME  Short of refactoring everything... uses my old Zend_Db like API.
   *
   * @return coreDatabase
   */
  public function getDatabase()
  {
    if (!isset($this->core_db))
    {
      // Create database connection when needed
      $db = new coreDatabaseMySQL(sfConfig::get('app_db_connection'));
      $db->connect();
      $this->core_db = $db;
    }
    
    return isset($this->core_db) ? $this->core_db : null;
  }

  public function profileStart()
  {
    $this->profile_time = microtime(true);
  }

  public function profileEnd()
  {
    return null !== $this->profile_time ? sprintf('%.0f', (microtime(true) - $this->profile_time) * 1000) : 0;
  }

  public function getAdminInfoFooter()
  {
    $profiler = $this->core_db->getProfiler();

    $totaltime = (microtime(true) - $this->profile_time);

    if (null === $profiler)
    {
      return $totaltime;
    }

    $phptime = $totaltime - $profiler->getQueryTime();
    $sqltime = $profiler->getQueryTime();

    if ($totaltime > 0)
    {
      $percentphp = number_format((($phptime / $totaltime) * 100), 2);
      $percentsql = number_format((($sqltime / $totaltime) * 100), 2);
    }
    else
    {
      // if we've got a super fast script...
      $percentphp = 0;
      $percentsql = 0;
    }

    $html = 'Generated in '.$profiler->format_time_duration($totaltime)." ($percentphp% PHP / $percentsql% MySQL)";

    return $html;
  }
}


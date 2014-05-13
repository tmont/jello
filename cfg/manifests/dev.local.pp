Exec {
  path => '/usr/bin:/bin:/usr/sbin:/sbin',
  logoutput => on_failure
}

$default_timezone = 'America/Los_Angeles'

node 'cb-web.dev.local' {
  include firstrun
  include common
  include curveball::params
  include curveball::users

  package { 'vim':
    ensure => present
  }

  class { 'nodejs':
    version => $::curveball::params::node_version
  }

  class { 'timezone':
    timezone => $default_timezone
  }

  $www_dir = "/var/www/sites/${curveball::params::host}"

  class { 'curveball::affiliate_www':
    www_dir => $www_dir,
    watch_config_file => '/vagrant/src/affiliate-www/watcher-config.js',
    node_path => "/var/www/sites/${curveball::params::host}/node_modules"
  }

  class { 'curveball::affiliate_static':
    www_dir => $www_dir,
  }

  class { 'curveball::dev_rsync':
    www_dir => $www_dir
  }

  class { 'curveball::cache':
    store_memory => '64mb',
    cache_memory => '64mb'
  }

  Class['firstrun']
    -> Class['common']
    -> Package['vim']
    -> Class['timezone']
    -> Class['redis']
    -> Class['nodejs']
    -> Class['curveball::params']
    -> Class['curveball::users']
    -> Class['curveball::dev_rsync']
    -> Class['curveball::affiliate_www']
    -> Class['curveball::affiliate_static']
    -> Class['curveball::cache']
}
Exec {
  path => '/usr/bin:/bin:/usr/sbin:/sbin',
  logoutput => on_failure
}

$default_timezone = 'America/Los_Angeles'

node 'jello.dev.local' {
  include firstrun
  include jello::params
  include jello::users

  package { 'vim':
    ensure => present
  }

  class { 'nodejs':
    version => $::jello::params::node_version
  }

  class { 'timezone':
    timezone => $default_timezone
  }

  $www_dir = "/var/www/sites/${jello::params::host}"

  class { 'jello::www':
    www_dir => $www_dir,
    watch_config_file => '/vagrant/src/www/watcher-config.js',
    node_path => "/var/www/sites/${jello::params::host}/node_modules"
  }

  class { 'jello::static':
    www_dir => $www_dir,
  }

  class { 'jello::dev_rsync':
    www_dir => $www_dir
  }

  class { 'jello::cache':
    store_memory => '64mb',
    cache_memory => '64mb'
  }

  Class['firstrun']
    -> Package['vim']
    -> Class['timezone']
    -> Class['nodejs']
    -> Class['jello::params']
    -> Class['jello::users']
    -> Class['jello::dev_rsync']
    -> Class['jello::www']
    -> Class['jello::static']
    -> Class['jello::cache']
}
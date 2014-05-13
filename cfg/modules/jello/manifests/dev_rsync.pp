class jello::dev_rsync ($www_dir) {
  anchor { 'jello::dev_rsync::begin':
    before => [
      Exec['rsync-web-files']
    ]
  }

  file{ '/var/www':
    ensure => directory,
  }

  file{ '/var/www/sites':
    ensure => directory,
  }

  file { $www_dir:
    ensure => directory,
    owner => $::jello::params::node_user
  }

  exec { "rsync-web-files":
    command => "rsync -vaz --delete --exclude config.json --exclude src/views --exclude src/static/fonts --exclude src/affiliate-static/js --exclude src/affiliate-static/css --exclude src/static/images /vagrant/src /vagrant/package.json ${www_dir}",
    require => [
      File['/var/www'],
      File['/var/www/sites'],
      File[$www_dir],
    ]
  }

  # create symbolic links for client-side stuff so it doesn't require a restart
  file { "${www_dir}/src/www/views":
    ensure => link,
    target => "/vagrant/src/www/views",
    require => Exec["rsync-web-files"]
  }
  file { "${www_dir}/src/static/css":
    ensure => link,
    target => "/vagrant/src/static/css",
    require => Exec["rsync-web-files"]
  }

  file { "${www_dir}/src/static/fonts":
    ensure => link,
    target => "/vagrant/src/static/fonts",
    require => Exec["rsync-web-files"]
  }

  file { "${www_dir}/src/static/images":
    ensure => link,
    target => "/vagrant/src/static/images",
    require => Exec["rsync-web-files"]
  }

  file { "${www_dir}/src/static/js":
    ensure => link,
    target => "/vagrant/src/static/js",
    require => Exec["rsync-web-files"]
  }

  anchor { 'jello::dev_rsync::end':
    require => [
      File["${www_dir}/src/www/views"],
      File["${www_dir}/src/static/css"],
      File["${www_dir}/src/static/fonts"],
      File["${www_dir}/src/static/images"],
      File["${www_dir}/src/static/js"],
    ]
  }
}
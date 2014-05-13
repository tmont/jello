class jello::static ($www_dir) {
  include jello::params

  anchor { 'jello::static::begin':
    before => [
      File["${www_dir}/src/static/config.json"]
    ]
  }

  $static_watch_config_file = "${www_dir}/src/static/watcher-config.js"

  $static_service_name = "jello-static"
  $proxy_name = 'node'
  file { "${www_dir}/src/static/config.json":
    ensure => present,
    content => template("jello/static-config.json.erb"),
    mode => 0644,
    notify => Service[$static_service_name],
  }

  nginx::resource::vhost { $::jello::params::static_host:
    ensure => present,
    listen_port => $::jello::params::static_port,
    rewrite_www_to_non_www => true,
    proxy => "http://${proxy_name}-static",
    index_files => [],
    proxy_set_header => [
      'Connection \'\'',
      'Host $host'
    ],
    location_cfg_append => {
      proxy_next_upstream => 'error timeout http_502 http_504',
        expires => 'max',
        add_header => "Access-Control-Allow-Origin ${jello::params::scheme}://${jello::params::host}"
      }
  }

  nginx::resource::upstream { "${proxy_name}-static":
    ensure => present,
    members => [ "localhost:${jello::params::static_listenPort}" ],
    upstream_cfg_prepend => {
      keepalive => '100'
    }
  }

  nodeapp::instance { $static_service_name:
    log_dir => $::jello::params::log_dir,
    user => 'curveball',
    group => 'curveball',
    entry_point => "${www_dir}/src/static/app.js",
    watch_config_file => $static_watch_config_file,
    time_zone => 'Etc/UTC',
    require => [
      Nginx::Resource::Upstream["${proxy_name}-static"],
      Nginx::Resource::Vhost[$::jello::params::static_host],
      File["${www_dir}/src/static/config.json"]
    ],
  }

  anchor { 'jello::static::end':
    require => [
      Nodeapp::Instance[$static_service_name]
    ]
  }
}
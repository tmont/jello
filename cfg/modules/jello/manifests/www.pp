class jello::www (
  $www_dir,
  $watch_config_file = undef,
  $npm_install_args = '--unsafe-perm',
  $node_path = undef
) {
  include jello::params
  include git

  $proxy_name = 'node'

  class { 'nginx':
    proxy_http_version => '1.1',
    gzip => 'on',

    # using map makes error_page respond with a json document if the client
    # expects application/json
    blocks => [
  'map $http_accept $error_doc {
    default /error.html;
    ~application/json /error.json;
  }'
    ],

    http_cfg_append => {
      gzip_proxied => 'any',
      gzip_min_length => '1024',
      gzip_types => 'text/plain text/css application/json application/javascript text/xml application/xml application/xml+atom text/javascript',
      proxy_cache_path => '/var/cache/nginx levels=1:2 keys_zone=microcache:5m max_size=1000m',
    }
  }

  # prevent nginx default vhost from being activated
  nginx::resource::vhost { '_':
    ensure => present,
    index_files => [],
    listen_options => 'default_server',
    use_default_location => false,
    vhost_cfg_append => {
      return => 444
    }
  }

  file { $::jello::params::log_dir:
    ensure => directory,
    owner => $::jello::params::node_user
  }

  logrotate::rule { 'jello-app-logs':
    path => "${jello::params::log_dir}/*.log",
    rotate => 1,
    rotate_every => 'day',
    missingok => true,
    ifempty => false,
    size => '5M',
    copy => true,
    copytruncate => true,
    require => File[$::jello::params::log_dir]
  }

  $service_name = 'jello-web'

  file { "${www_dir}/src/www/config.json":
    ensure => present,
    content => template("jello/www-config.json.erb"),
    mode => 0644,
    notify => Service[$service_name],
    require => [
      Logrotate::Rule['jello-app-logs']
    ]
  }

  nginx::resource::vhost { $::jello::params::host:
    ensure => present,
    listen_port => $::jello::params::port,
    rewrite_www_to_non_www => true,
    proxy => "http://${proxy_name}",
    index_files => [],
    add_header => {
      'X-Server-Name' => '$hostname'
    },

    proxy_set_header => [
      'Connection \'\'',
      'Host $host',
      'X-Real-IP $remote_addr',
      'X-Forwarded-For $proxy_add_x_forwarded_for'
    ],
    vhost_cfg_append => {
      proxy_cache => 'microcache',
      proxy_cache_key => '"$scheme$host$request_method$request_uri$cookie_sid"',
      proxy_cache_valid => '200 302 2s',
      proxy_cache_use_stale => 'updating',
      proxy_max_temp_file_size => '1M',
      recursive_error_pages => 'on',

      # use error_page for relevant status codes from node proxy
      proxy_intercept_errors => 'on',
      error_page => [
        '501 502 503 504 @maintenance',
        # allows posts to static content (http://leandroardissone.com/post/19690882654/nginx-405-not-allowed)
        '405 = $uri'
      ]
    },
    location_cfg_append => {
      proxy_next_upstream => 'error timeout http_502 http_504',
      expires => '2s',
    }
  }

  nginx::resource::location { 'static error handler':
    ensure => present,
    vhost => $::jello::params::host,
    location => '@maintenance',
    index_files => [],
    www_root => "${www_dir}/src/www/views/static",
    rewrite_rules => [ '^.*$ $error_doc break' ]
  }

  nginx::resource::upstream { $proxy_name:
    ensure => present,
    members => [ "localhost:${jello::params::listenPort}" ],
    upstream_cfg_prepend => {
      keepalive => '100'
    }
  }

  # install node app
  $npm_install_dir = $www_dir

  nodeapp::instance { $service_name:
    log_dir => $::jello::params::log_dir,
    entry_point => "${www_dir}/src/www/app.js",
    watch_config_file => $watch_config_file,
    time_zone => 'Etc/UTC',
    user => $::jello::params::node_user,
    group => $::jello::params::node_user,
    node_path => $node_path,
    require => [
      Nginx::Resource::Upstream[$proxy_name],
      Nginx::Resource::Vhost[$::jello::params::host],
      File["${www_dir}/src/www/config.json"]
    ],
    npm_install_dir => $npm_install_dir,
    npm_install_args => $npm_install_args
  }

  anchor { 'jello::www::end':
    require => [
      Nodeapp::Instance[$service_name]
    ]
  }
}

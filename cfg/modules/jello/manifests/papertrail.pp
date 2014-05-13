class jello::papertrail {
  class { '::papertrail':
    log_port => 18653,
    rate_limit_interval => 1,
    rate_limit_burst => 1000,
    extra_logs => [
      '/var/log/nginx/error.log',
      '/var/log/nginx/*error.log',

      '/var/log/nginx/access.log',
      '/var/log/nginx/*access.log',

      '/var/log/jello/*.log',

      '/var/log/mysql/error.log',
      '/var/log/mysql.err'
    ]
  }
}
class jello::params {
  $port = 80
  $listenPort = 3000
  $useObjectCache = true
  $log_dir = '/var/log/jello'
  $node_user = 'jello'
  $node_version = '0.10.28'
  $store_port = 6379
  $cache_port = 6380

  case $environment {
    'dev': {
      $scheme = 'http'

      $store_host = '127.0.0.1'
      $cache_host = '127.0.0.1'

      $db_host = 'localhost'
      $db_user = 'jello'
      $db_password = 'jello'
      $db_port = 3306
      $db_database = 'jello'
      $db_userHost = 'localhost'
      $db_bindAddress = $ipaddress_eth1

      $cacheViews = false
      $host = 'jello.local'
      $session_secret = 'jellobean'
      $session_ttl = 86400
      $log_level = 'debug'
      $log_showPid = false
      $log_timestamps = 'quiet'
      $log_transports = [ 'console' ]
      $debugTemplates = true
      $static_useCluster = false
      $workers = 1
      $static_workers = 1
      $useCluster = false
      $static_cacheLess = false
      $static_cacheJs = false
      $static_minifyJs = false

      $bundleJs = false

      $mail = {
        smtpTransport => {
          service => 'Gmail',
          auth => {
            user => 'jellotester@gmail.com',
            pass => 'jello for life'
          },
        },
        redirect => 'jellotester@gmail.com'
      }

      $static_host = "static.jello.local"
      $staticBasePath = "//${static_host}"
    }
    'prod': {
      $scheme = 'https'
      $memcached_host = '127.0.0.1'
      $memcached_port = 11211

      $store_host = '172.0.0.15'
      $cache_host = '172.0.0.15'

      $db01 = '172.0.0.10'
      $db02 = '172.0.0.18'

      $db_host = $db01
      $db_user = 'jello'
      $db_password = 'bill cosby loves jello'
      $db_port = 3306
      $db_database = 'jello'
      $db_userHost = '172.0.0.%'
      $db_bindAddress = $ipaddress_eth2

      $cacheViews = true
      $host = 'jelloanalytics.com'
      $session_secret = 'catch you on the flip side'
      $session_ttl = 86400
      $log_level = 'info'
      $log_showPid = false
      $log_timestamps = false
      $log_transports = [ 'console' ]
      $debugTemplates = false
      $static_useCluster = true
      $workers = 0
      $static_workers = 0
      $useCluster = false
      $static_cacheLess = true
      $static_cacheJs = true
      $static_minifyJs = true
      $bundleJs = true
    }
  }

  $static_port = 80
  $static_listenPort = 3100
  $mail_domain = $host
}
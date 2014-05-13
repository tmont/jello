class jello::maria ($server_id, $slave_of = undef) {
  include apt::update, jello::params

  apt::source { 'mariadb':
    location => 'http://ftp.osuosl.org/pub/mariadb/repo/10.0/ubuntu',
    repos => 'main',
    key => 'cbcb082a1bb943db',
    key_server => 'keyserver.ubuntu.com',
    include_src => true
  }

  $mysqld_defaults = {
    server-id => $server_id,
    bind_address => $::jello::params::db_bindAddress,
    default_time_zone => '+00:00',

    # https://mariadb.com/kb/en/binary-log-formats/
    binlog-format => 'MIXED'
  }

  $mysqld_master_overrides = {
    log-bin => true,
    log-basename => 'master',
    binlog_do_db => 'jello'
  }

  $mysqld_overrides = $slave_of ? {
    undef => merge($mysqld_defaults, $mysqld_master_overrides),
    default => $mysqld_defaults
  }

  class { 'mysql::server':
    package_name => 'mariadb-server',
    ensure => '10.0.11+maria-1~trusty',
    require => [
      Apt::Source['mariadb']
    ],
    override_options => {
      mysqld => $mysqld_overrides
    },
    users => {
      'root@%' => {
        ensure => 'present'
      },
      'replicator@%' => {
        ensure => 'present',
        password_hash => mysql_password('password')
      }
    },
    grants => {
      'root@%/*.*' => {
        ensure => 'present',
        privileges => [ 'All' ],
        user => 'root@%',
        table => '*.*',
      },
      'replicator@%/*.*' => {
        ensure => 'present',
        privileges => [ 'REPLICATION SLAVE' ],
        user => 'replicator@%',
        table => '*.*',
      }
    }
  }

  if $slave_of != undef {
    file { 'replicator-script':
      ensure => 'present',
      path => '/tmp/replicator.sh',
      mode => '0755',
      source => 'puppet:///modules/jello/replicator.sh',
      require => Class['mysql::server']
    }
  }
}
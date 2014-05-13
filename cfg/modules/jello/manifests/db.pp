class jello::db {
  anchor { 'jello::db::begin':
    before => Class['jello::params'],
  }

  include jello::params

  $db_user = "${jello::params::db_user}@${jello::params::db_userHost}"
  $grant_user = "${db_user}/${jello::params::db_database}.*"
  mysql_user { $db_user:
    ensure => 'present',
    password_hash => mysql_password($::jello::params::db_password),
  }

  mysql_grant { $grant_user:
    ensure => 'present',
    privileges => [ 'All' ],
    options => [ 'GRANT' ],
    user => $db_user,
    table => "${jello::params::db_database}.*",
    require => Mysql_user[$db_user]
  }

  # create the database
  mysql_database { $::jello::params::db_database:
    ensure => 'present',
    charset => 'utf8',
  }

  anchor { 'jello::db::end':
    require => [
      Mysql_user[$db_user],
      Mysql_grant[$grant_user],
      Mysql_database[$::jello::params::db_database],
    ]
  }
}
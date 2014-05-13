class jello::users {
  include jello::params

  group { $::jello::params::node_user:
    ensure => present,
    system => true,
  }

  user { $::jello::params::node_user:
    ensure => present,
    gid => $::jello::params::node_user,
    system => true,
    shell => '/bin/false',
    require => Group[$::jello::params::node_user],
  }
}
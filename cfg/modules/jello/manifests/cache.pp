class jello::cache($store_memory, $cache_memory) {
  include jello::params

  # installs redis, and starts the service on port 6379
  # this redis server is only used for storing sessions and reset password tokens
  # so it's okay that it has a small maxmemory value
  class { 'redis':
    version => '2.8.5',
    redis_port => $::jello::params::store_port,
    redis_max_memory => $store_memory,
    redis_max_memory_policy => 'noeviction'
  }

  # creates a redis instance for use as a cache port 6380
  redis::instance { 'redis-cache':
    redis_port => $::jello::params::cache_port,
    redis_max_memory => $cache_memory,
  }
}
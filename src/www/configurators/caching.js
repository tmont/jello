var mesia = require('mesia'),
	util = require('util');

module.exports = function(container, libs, next) {
	var cacheInvalidationMapping = {};

	var lifetime = libs.sahara.lifetime;

	function createCacheClient(container, callback) {
		container.resolve('RedisCacheClient', function(err, redisClient) {
			if (err) {
				callback(err);
				return;
			}

			var log = container.resolveSync('Logger');
			var cacheClient = new mesia.persistence.caching.RedisCache(redisClient, log);
			callback(null, cacheClient);
		});
	}

	container
		.registerInstance(cacheInvalidationMapping, 'CacheInvalidationMapping', lifetime.memory())
		.registerType(mesia.persistence.caching.CacheInvalidator, lifetime.memory())
		.registerFactory(createCacheClient, 'CacheClient', lifetime.memory());

	var config = container.resolveSync('Config');

	if (config.useObjectCache) {
		container.registerType(mesia.persistence.caching.JsonCache, lifetime.memory());
	} else {
		var noopCache = {
			log: mesia.Logger.noop,
			get: function(key, callback) {
				callback();
			},

			set: function(key, value, ttl, callback) {
				callback();
			},

			invalidate: function(key, callback) {
				callback();
			}
		};

		container.registerInstance(noopCache, 'JsonCache', lifetime.memory());
	}

	next();
};
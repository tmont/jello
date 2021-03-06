module.exports = function(key, redisConfig) {
	return function(container, libs, next) {
		var redis = libs.redis,
			lifetime = libs.sahara.lifetime;

		var client = redis.createClient(redisConfig);

		container.registerInstance(client, key || 'RedisClient', lifetime.memory());
		next();
	};
};
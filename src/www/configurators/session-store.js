/**
 * Configures the session storage used by the web app
 */
module.exports = function(container, libs, next) {
	var sahara = libs.sahara,
		config = container.resolveSync('Config');

	function createSessionStore(container) {
		var session = container.resolveSync('ExpressSession'),
			SessionStore = require('connect-redis')(session);
		return new SessionStore({
			client: container.resolveSync('RedisStoreClient'),
			ttl: config.session.ttl
		});
	}

	container.registerFactory(createSessionStore, 'SessionStore', sahara.lifetime.memory());
	next();
};
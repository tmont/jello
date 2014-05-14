var core = require('../../../../core'),
	sahara = require('sahara');

module.exports = function(req, res, next) {
	var repositories = core.repositories,
		container = req.container;

	function invalidateCache(context, next) {
		next(function(done) {
			if (context.error) {
				//some kind of error occurred, don't invalidate
				done();
				return;
			}

			var log = container.resolveSync('Logger'),
				entity = context.arguments[0];

			container.resolveSync('CacheInvalidator').invalidate(entity, function(err) {
				if (err) {
					context.error = err;
					log.error('Failed to invalidate the cache for entity', entity);
					log.error(err);
				}
				done();
			});
		});
	}

	Object.keys(repositories).forEach(function(key) {
		container
			.registerType(repositories[key], sahara.lifetime.memory())
			.intercept([ repositories[key], 'save' ], invalidateCache).async()
			.intercept([ repositories[key], 'del' ], invalidateCache).async();
	});

	next();
};
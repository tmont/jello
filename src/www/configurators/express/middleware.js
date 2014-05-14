var sahara = require('sahara'),
	async = require('async'),
	mesia = require('mesia');

/**
 * This configurator defines all middleware functions that
 * will be executed in the request pipeline.
 *
 * These will be executed before every request. mesia grabs
 * whatever's registered in the container for "Middleware", and
 * executes all of the functions in series (asynchronously, of course).
 * Each function acts just like a normal express middleware function.
 *
 * Make sure you know the difference between container and req.container!
 * Make sure you're ALWAYS ALWAYS ALWAYS using req.container inside
 * a middleware function!
 */
module.exports = function(container, libs, next) {
	var config = container.resolveSync('Config');

	function notNeededForContentRequest(req) {
		return req.headers['x-requested-with'] === 'XMLHttpRequest';
	}

	function addLocalToRequest(req, name, value) {
		req.container.resolveSync('RequestLocals')[name] = value;
	}

	var middleware = [
//		function(req, res, next) {
//			mesia.web.configurators.mariadb(config.db, 'DbConnection')(req.container, libs, next);
//		},
//		function(req, res, next) {
//			//350 is the limit in ms for logging "slow" queries
//			mesia.web.configurators.sqlExecutor('SqlExecutor', 'DbConnection', 350)(req.container, libs, next);
//		},
//		function(req, res, next) {
//			mesia.web.configurators.transactionInterceptor('SqlExecutor')(req.container, libs, next);
//		},
		require('./middleware/repositories'),
		require('./middleware/entity-validation'),
//		require('./middleware/services'),
//		require('./middleware/logged-in-user')(addLocalToRequest),

		require('./middleware/client-side-js-files')(addLocalToRequest),
		require('./middleware/csrf')
	];
	container.registerInstance(middleware, 'Middleware', sahara.lifetime.memory());
	next();
};
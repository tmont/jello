var start = Date.now();

function safeLog(message) {
	(log || console).error(message);
	if (message && message.stack) {
		(log || console).error(message.stack);
	}
}

process.on('uncaughtException', function(err) {
	safeLog('Uncaught exception');
	safeLog(err);
	process.exit(1);
});

var config = require('./config');

require('http').globalAgent.maxSockets = 2000;
require('https').globalAgent.maxSockets = 2000;

process.on('SIGTERM', function() {
	var message = 'Received SIGTERM, exiting';
	if (log) {
		log.warn(message);
	} else {
		console.log(message);
	}
	process.exit(0);
});

var moment = require('moment'),
	mesia = require('mesia'),
	sahara = require('sahara'),
	lifetime = sahara.lifetime,
	goa = require('goa'),
	cluster = require('cluster'),
	async = require('async'),
	log = mesia.Logger.create(config.log);

config.version = require('../../package.json').version;

if (config.useCluster && cluster.isMaster) {
	mesia.web.createMaster(config.workers, log);
} else {
	var libs = {
			goa: goa,
			sahara: sahara,
			mysql: require('mysql'),
			redis: require('then-redis')
		},
		containerStart = Date.now(),
		container = new sahara.Container();

	if (log.logger.level === 'trace') {
		(function() {
			function colorize(name, color) {
				color = color || '33';
				return '\x1B[' + color + 'm' + name + '\x1B[39m';
			}

			container
				.on('registering', function(key) {
					log.trace(colorize(key) + ' is being registered');
				})
				.on('resolving', function(key) {
					log.trace(colorize(key) + ' is being resolved');
				})
				.on('resolved', function(key) {
					log.trace(colorize(key) + ' has been resolved');
				});

			container.builder
				.on('building', function(info) {
					log.trace('building ' + colorize(info.name));
				})
				.on('built', function(info) {
					log.trace('built ' + colorize(info.name));
				})
				.on('intercepting', function(instance, methodName) {
					var name = instance.constructor.name + '.' + methodName;
					log.trace('intercepting ' + colorize(name, 35));
				});
		}());
	}

	if (config.env !== 'prod') {
		config.version += '_' + moment().format('YYYYMMDD_HHmmss');
	}

	//default configuration stuff
	container
		.registerInstance(log, 'Logger', lifetime.memory())
		.registerInstance(__dirname, 'AppRoot', lifetime.memory())
		.registerInstance(config, 'Config', lifetime.memory());

	//the order of these is significant!
	async.eachSeries([
		'route-locals',
		'destructors',
		require('./configurators/redis')('RedisStoreClient', config.store),
		require('./configurators/redis')('RedisCacheClient', config.cache),
		mesia.web.configurators.registerAppDirectory('controllers'),
//		mesia.web.configurators.registerAppDirectory('controllers/services'),

		'session-store',
		'controller-factory',
		mesia.web.configurators.express,

		'client-side-partials',
		'sql',
		'caching',
		'express/locals',
		'express/middleware',
		'express/routing',
		function(container, libs, next) {
			var app = container.resolveSync('App');
			app.use(mesia.web.middleware.errorHandler(container));
			next();
		},

		require('./configurators/startup/build-graph')
	], function(configurator, next) {
		if (typeof(configurator) === 'function') {
			configurator(container, libs, next);
		} else {
			require('./configurators/' + configurator)(container, libs, next);
		}
	}, function(err) {
		if (err) {
			log.error('Error configuring app', err);
			process.exit(1);
			return;
		}

		container.resolveSync('App').listen(config.listenPort);
		log.info('Listening on port ' + config.listenPort);
		log.debug('container configured in ' + (Date.now() - containerStart) + 'ms');
		log.debug('app configured in ' + (Date.now() - start) + 'ms');
	});
}

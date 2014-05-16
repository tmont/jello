var config = require('./config');
process.on('uncaughtException', function (err) {
	(log || console).error('Uncaught exception', err);
	if (err && err.stack) {
		(log || console).error(err.stack);
	}
	process.exit(1);
});

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

function sendError(status, err, send) {
	if (err && status >= 500) {
		log.error(err);
	}

	send(goa.error({ status: status }));
}

function trySendNotModified(req, mtime, send) {
	var modifiedSince = req.headers['if-modified-since'];
	if (!modifiedSince) {
		return false;
	}

	modifiedSince = new Date(modifiedSince).getTime();
	if (!modifiedSince || mtime.getTime() > modifiedSince) {
		return false;
	}

	send(goa.action(null, null, { status: 304 }));
	return true;
}

function setLastModified(res, date) {
	res.setHeader('Last-Modified', moment(date).format());
}

var start = Date.now(),
	path = require('path'),
	fs = require('fs'),
	moment = require('moment'),
	goa = require('goa'),
	config = require('./config'),
	mesia = require('mesia'),
	log = mesia.Logger.create(config.log),
	root = __dirname,
	GraphBuilder = require('require-graph'),
	jsCache = {},
	graph = new GraphBuilder(),
	cssCompiler = new mesia.LessCompiler(path.join(__dirname, 'css'), [], {
		useCache: config.cacheLess
	}),
	app = goa(function(name, context, callback) {
		callback(null, new TheController(context));
	});

config.version = require('../../package.json').version;

function TheController(context) {
	this.req = context.req;
	this.res = context.res;
}

TheController.prototype = {
	serveStaticFile: function(params, send) {
		switch (params.type) {
			case 'fonts':
			case 'images':
			case 'js':
				var filename = params.filename;

				if (filename.indexOf('_explicit_/') === 0) {
					filename = filename.substring('_explicit_/'.length);
				}

				var realPath = path.join(root, params.type, filename);
				send(goa.file(realPath));
				break;
			default:
				sendError(404, null, send);
				break;
		}
	},

	js: function(params, send) {
		var physicalFile = path.join(root, 'js', params.filename),
			self = this;

		if (physicalFile.indexOf('_explicit_') !== -1) {
			var staticParams = {
				filename: params.filename,
				type: 'js'
			};

			this.serveStaticFile(staticParams, send);
			return;
		}

		fs.exists(physicalFile, function(exists) {
			if (!exists) {
				sendError(404, null, send);
				return;
			}

			try {
				var js, cached = jsCache[physicalFile];
				if (config.cacheJs && cached) {
					if (trySendNotModified(self.req, cached.mtime, send)) {
						return;
					}

					js = cached.value;
				} else {
					js = graph.concatenate(physicalFile);

					if (config.minifyJs) {
						js = require('uglify-js').minify(js, {
							fromString: true
						}).code;
					}
					if (config.cacheJs) {
						cached = jsCache[physicalFile] = {
							mtime: new Date(),
							value: js
						};
					}
				}

				if (cached) {
					setLastModified(self.res, cached.mtime);
				}

				send(goa.action(js, 'text/javascript'));
			} catch (e) {
				sendError(500, e, send);
			}
		});
	},

	css: function(params, send) {
		var self = this;
		cssCompiler.compileFile(params.filename, function(err, result) {
			if (err) {
				sendError(err.code === 'ENOENT' ? 404 : 500, err, send);
				return;
			}

			if (result.mtime && trySendNotModified(self.req, result.mtime, send)) {
				return;
			}

			var css = result.value
				.replace(/\$staticBasePath\$/g, config.staticBasePath)
				.replace(/\$version\$/g, config.version);

			if (cssCompiler.useCache && result.mtime) {
				setLastModified(self.res, result.mtime);
			}

			send(goa.action(css, 'text/css'));
		});
	},

	notFound: function(params, send) {
		send(goa.error({ status: 404 }));
	}
};

config.version = require('../../package.json').version;
if (config.env !== 'prod') {
	config.version += '_' + moment().format('YYYYMMDD_HHmmss');
}

app.enable('trust proxy');
app.enable('strict routing');
app.enable('case sensitive routing');
if (log.isDebugEnabled()) {
	app.use(log.middleware.bind(log));
}

app.use(function (req, res, next) {
	res.header('X-powered-by', 'Mr. Snappy (' + require('os').hostname() + ')');
	next();
});

app.get('/css/:version/:filename([\\s\\S]*)', { controller: 'default', action: 'css' });
app.get('/js/:version/:filename([\\s\\S]*)', { controller: 'default', action: 'js' });
app.get('/:type/:version/:filename([\\s\\S]*)', { controller: 'default', action: 'serveStaticFile' });
app.get('*', { controller: 'default', action: 'notFound' });

app.use(function(err, req, res, next) {
	if (!err.status || err.status >= 500) {
		log.error(err);
	}
	res.status(err.status || 500);
	res.send('');
});

function buildGraph(next) {
	if (!config.bundleJs) {
		next();
		return;
	}

	var jsRoot = path.normalize(__dirname + '/js'),
		graphOptions = {
			removeHeaders: true,
			shouldParse: function(filename) {
				return /\.js$/.test(filename);
			}
		};

	function build(name, next) {
		var mainFile = path.join(jsRoot, 'main-' + name + '.js');
		graph.buildGraph(mainFile, graphOptions, next);
	}

	require('async').each([ 'jello', 'jquery', 'backbone' ], build, next);
}

buildGraph(function(err) {
	if (err) {
		log.error('Error building graph', err);
		process.exit(1);
		return;
	}

	app.listen(config.listenPort);
	log.info('Listening on port ' + config.listenPort);
	log.debug('app configured in ' + (Date.now() - start) + 'ms');
});

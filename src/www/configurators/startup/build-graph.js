var GraphBuilder = require('require-graph'),
	async = require('async'),
	path = require('path');

/**
 * Generates dependency graph for client-side JS files
 */
module.exports = function(container, libs, next) {
	var appRoot = container.resolveSync('AppRoot'),
		config = container.resolveSync('Config');

	var clientJsFiles = {};
	container.registerInstance(clientJsFiles, 'ClientJsFiles');

	if (config.bundleJs) {
		//static app handles this
		next();
		return;
	}

	var graph = new GraphBuilder(),
		jsRoot = path.normalize(appRoot + '/../static/js'),
		graphOptions = {
			removeHeaders: true,
			shouldParse: function(filename) {
				return /\.js$/.test(filename);
			}
		};

	function build(name, next) {
		var mainFile = path.join(jsRoot, 'main-' + name + '.js');
		graph.buildGraph(mainFile, graphOptions, function(err, files) {
			if (err) {
				next(err);
				return;
			}

			clientJsFiles[name] = files.map(function(absolutePath) {
				return absolutePath.substring(absolutePath.indexOf('/js/') + 4);
			});
			next();
		});
	}

	async.each([ 'jello', 'jquery' ], build, next);
};
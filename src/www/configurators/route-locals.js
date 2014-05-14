var mesia = require('mesia'),
	Route = mesia.web.Route,
	routes = require('../routes');

/**
 * Sets up local template variables used by routes
 *
 * RouteLocals are used by the controller context when rendering
 * view templates. See Route.createLocals for details.
 */
module.exports = function(container, libs, next) {
	var config = container.resolveSync('Config'),
		lifetime = libs.sahara.lifetime;

	// NOTE: this function is duplicated in jello-app.js
	function buildPath(parts) {
		return parts.slice(0, -1).join('/') + '/' + config.version + '/' + parts.slice(-1);
	}

	var locals = Route.createLocals(config, routes, buildPath);

	container.registerInstance(locals, 'RouteLocals', lifetime.memory());
	next();
};
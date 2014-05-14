/**
 * Sets up templates used by client-side JS
 *
 * These are available in the client in jello.context.partials,
 * converted to camel case.
 */
module.exports = function(container, libs, next) {
	var sahara = libs.sahara;

	// templatePath -> array of partial paths (rooted in views/partials/)
	var routePartials = {

	};

	container.registerInstance(routePartials, 'ClientSidePartials', sahara.lifetime.memory());
	next();
};
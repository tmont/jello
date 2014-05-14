var goa = require('goa'),
	mesia = require('mesia'),
	sahara = require('sahara');

/**
 * Registers the controller factory for the web app
 *
 * The controller factory is built using Sahara, so all dependencies
 * will be injected automatically.
 */
module.exports = function(container, libs, next) {
	container.registerInstance(
		goa(mesia.web.controllerFactory(container)),
		'App',
		sahara.lifetime.memory()
	);

	next();
};
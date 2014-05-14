var mesia = require('mesia');

module.exports = function(container, libs, next) {
	var app = container.resolveSync('App');

	for (var key in mesia.utils) {
		app.locals[key] = mesia.utils[key];
	}

	var config = container.resolveSync('Config');
	app.locals.config = app.locals.config || {};
	app.locals.config.version = config.version;
	app.locals.bundleJs = config.bundleJs;
	next();
};
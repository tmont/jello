var routes = require('../../routes'),
	lifetime = require('sahara').lifetime,
	url = require('url');

module.exports = function(container, libs, next) {
	var app = container.resolveSync('App');
	var config = container.resolveSync('Config');

	function routeGet(route, data) {
		function setRoute(req, res, next) {
			req.container.registerInstance(route, 'CurrentRoute', lifetime.memory());
			next();
		}

		//provide a way for the controller to discover that
		//this is a request for just the content of the page
		function thisIsContent(req, res, next) {
			req.container.resolveSync('ControllerContext').isContentRequest = true;
			res.set('Content-Type', 'application/json');
			next();
		}

		var url = route.url || '*';
		app.get(url + '.content', setRoute, thisIsContent, route.middleware(app), data);
		app.get(url, setRoute, route.middleware(app), data);
	}

	app.get('/version', function(req, res) {
		res.send(config.version);
	});

	routeGet(routes.home, { controller: 'home' });
	app.get('/favicon.ico', { controller: 'home', action: 'favicon' });
	app.get('/robots.txt', { controller: 'home', action: 'robots' });

	routeGet(routes.login, { controller: 'account', action: 'login' });



	routeGet(routes.notFound, { controller: 'error', action: 'notFound' });

	//set up error routes
	var errorRoutes = {
		'400': routes.badRequest,
		'401': routes.unauthorized,
		'403': routes.forbidden,
		'404': routes.notFound,
		'500': routes.serverError
	};

	container.registerInstance(errorRoutes, 'ErrorRoutes', lifetime.memory());
	next();
};

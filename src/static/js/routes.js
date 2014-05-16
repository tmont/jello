/** @depends
 * route.js
 */
(function(Route, exports) {
	function create(name, url, title, description, extra) {
		exports[name] = new Route(name, url, title, description, extra);
	}

	create('home', '/', 'Jello');
	create('login', '/login', 'Login | Jello');

	//error routes
	create('badRequest', null, 'Bad Request');
	create('unauthorized', null, 'Unauthorized');
	create('forbidden', null, 'Forbidden');
	create('notFound', null, 'Page not found');
	create('serverError', null, 'Internal Server Error');
}(
	typeof(module) !== 'undefined' ? require('mesia').web.Route : window.jello.Route,
	typeof(module) !== 'undefined' ? module.exports : (window.jello.routes = {})
));

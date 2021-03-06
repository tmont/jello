(function(window) {
	function replaceValues(subject, values) {
		if (subject && values) {
			if (Object.prototype.toString.call(values) === '[object Array]') {
				//if it's an array, it's the backbone router
				for (var i = 0; i < values.length; i++) {
					//replace them in order, disregarding the key
					subject = subject.replace(/:\w+\??/i, values[i]);
				}
			} else {
				//this comes from the express router
				for (var name in values) {
					subject = subject.replace(
						new RegExp(':' + name + '\\b\\??', 'gi'),
						values[name]
					);
				}
			}
		}

		return subject || '';
	}

	function buildUrl(url, values) {
		if (typeof(url) !== 'string') {
			return null;
		}

		var realUrl = replaceValues(url, values)
			//remove optional route values from route string
			.replace(/:[^\?]+\?/g, '')
			//remove trailing slash(es)
			.replace(/\/+$/, '');

		if (!realUrl) {
			realUrl = '/';
		}

		return realUrl;
	}

	function Route(name, url, title, description, extra) {
		this.name = name;
		this.url = url;
		this.title = title || '';
		this.description = description || this.title;
		this.type = (extra && extra.type) || 'website';
		this.image = extra && extra.image;
	}

	Route.prototype = {
		getUrl: function(values) {
			return buildUrl(this.url, values);
		},

		getInfo: function(values) {
			return {
				type: this.type,
				title: replaceValues(this.title, values),
				description: replaceValues(this.description, values),
				image: replaceValues(this.image, values)
			};
		}
	};

	Route.createLocals = function(config, routes, buildPath) {
		return {
			url: {
				image: function(file) {
					return buildPath([ config.staticBasePath, 'images', file ]);
				},
				js: function(file) {
					return buildPath([ config.staticBasePath, 'js', file ]);
				},
				font: function(file) {
					return buildPath([ config.staticBasePath, 'fonts', file ]);
				},
				css: function(file) {
					return buildPath([ config.staticBasePath, 'css', file ]);
				},
				route: function(name, values) {
					var route = routes[name];
					if (!route) {
						throw new Error('Invalid route name "' + name + '"');
					}

					return route.getUrl(values);
				}
			}
		};
	};

	window.jello.Route = Route;
}(window));
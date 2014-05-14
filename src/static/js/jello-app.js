/** @depends
 * route.js
 */
(function(window, document, $) {
	var app = window.jello;

	var pushStateSupported = (function() {
		var supported = window.history && 'pushState' in window.history;
		var androidVersion = /Android\s+([\d\.]+)/i.exec(navigator.userAgent);
		if (androidVersion && /Mobile\s+Safari/i.test(navigator.userAgent)) {
			//manual check for android because window.history.pushState exists
			//but is totally broken
			var version = androidVersion[1].split('.'),
				majorVersion = parseInt(version[0]),
				minorVersion = parseInt(version[1]);

			//anything less than 4.2 is not supported
			if (majorVersion < 4 || minorVersion < 2) {
				return false;
			}
		}

		return supported;
	}());

	function createRouter() {
		function handle(name) {
			return function() {
				var options = {},
					initialView = !app.views.current,
					args = [].slice.call(arguments);
				if (initialView) {
					options.el = $('#main').children().first();
				}

				app.views.current && app.views.current.remove();
				if (router[name]) {
					args.push(options);
					app.views.current = router[name].apply(router, args);
				} else if (app.views.pages[name]) {
					//default routing
					app.views.current = new app.views.pages[name](options);

					if (initialView) {
						//don't render it, because it was composed server-side
						//just set up all the event handling and run post render

						//set up the data first
						app.views.current.setData(app.parseViewData(app.initData.viewData));
						app.views.current.postRender();
					} else {
						app.views.current.render();
					}
				} else {
					throw new Error('No view for "' + name + '"');
				}
			};
		}

		var router = new Backbone.Router();
		for (var name in app.routes) {
			if (!app.routes[name].url) {
				continue;
			}
			router.route(app.routes[name].url.substring(1), name, handle(name));
		}

		return router;
	}

	$.extend(app, {
		referrer: null,
		router: null,
		start: function(callback) {
			var self = this;

			app.locals = $.extend(app.locals, app.Route.createLocals(app.config, app.routes, function(parts) {
				return parts.slice(0, -1).join('/') + '/' + app.config.version + '/' + parts.slice(-1);
			}), app.util);
			app.router = createRouter();
			Backbone.history.start({ pushState: pushStateSupported, hashChange: false });
			Backbone.history.on('route', function(router, name, args) {
				//hide all dropdowns when we navigate
				$('.dropdown').removeClass('open');
				$('.popover').remove();
				$('.bootstrap-datetimepicker-widget').remove();
			});

			//set up a click handler on all anchors
			//ignore anything with an explicit target or that is not relative
			//or that's a static asset
			$(document).on('click', 'a', function(e) {
				var $link = $(this),
					url = $link.attr('href');

				if (/^(\w+:|\/\/)/.test(url)) {
					//ignore absolute and protocol-relative URLs
					return true;
				}

				if (typeof(url) !== 'string' || url.charAt(0) === '#') {
					// don't do anything for fragments
					return false;
				}

				if ($link.data('ignore') !== undefined) {
					//if they're decorated with this attribute they aren't part of
					//the app (e.g. /logout links)
					return true;
				}

				if ($link.attr('target') !== undefined) {
					//if the anchor has an explicit target, allow the native
					//behavior to be executed
					return true;
				}

				if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
					//allow meta keys to do their native behavior
					return true;
				}

				app.navigate(url);

				//remove focus from links, since the page doesn't refresh and
				//it's really annoying, particularly for buttons with :focus style
				$link.blur();

				// make sure if you're trying to navigate we hide the error
				self.hideSiteError();

				return false;
			});

			//compile initial partials
			for (var name in app.context.partials) {
				app.context.partials[name] = app.evaluateTemplate(app.context.partials[name]);
			}

			callback && callback();
		},

		navigate: function(url, options) {
			if (url === window.location.pathname + window.location.search) {
				//if it's the same URL that we're currently on, force
				//backbone to reload it
				Backbone.history.loadUrl(url);
			} else {
				Backbone.history.navigate(url, options || { trigger: true });
			}
		},

		views: {
			pages: {},
			components: {},
			current: null,
			header: null
		},

		locals: {},
		models: {},

		request: {
			send: function(options, callback) {
				var error = null, result = null;
				if (!options.dataType) {
					options.dataType = 'json';
				}

				if (callback) {
					options.success = function(data) {
						result = data;
					};

					options.error = function(xhr) {
						error = true;
						try {
							error = result = JSON.parse(xhr.responseText);
						} catch (e) {
							error = new Error('An error occurred');
							error.statusCode = xhr.statusCode;
						}
					};

					options.complete = function() {
						callback(error, result);
					};
				}

				$.ajax(options);
			},

			get: function(url, options, callback) {
				if (typeof(options) === 'function') {
					callback = options;
					options = {};
				}

				options = $.extend(options || {}, { type: 'GET', url: url });
				this.send(options, callback);
			},

			post: function(url, options, callback) {
				if (typeof(options) === 'function') {
					callback = options;
					options = {};
				}

				options = $.extend(options || {}, { type: 'POST', url: url });
				this.send(options, callback);
			}
		},

		evaluateTemplate: function(template) {
			return eval('(' + template + ')');
		},

		parseViewData: function(data) {
			return data;
		},

		showSiteError: function(message, options) {
			var $error =  $('.site-error'),
				$container = $('.site-header > .container:first');

			$error.remove();
			$error = $('<div/>')
				.addClass('site-error alert alert-dismissable')
				.append($('<button/>')
					.attr({ 'data-dismiss': 'alert', title: 'Dismiss' })
					.addClass('close').html('&times;'))
				.append($('<div/>').addClass('site-error-message')
					.append($('<div/>').addClass('icon-container'))
					.append($('<div/>').addClass('error-content'))
				)
				.appendTo($container);

			if (options && options.noDismiss) {
				$error.removeClass('alert-dismissable').find('button.close').remove();
			}

			var gutter = 40;
			var width = $container.outerWidth() - (gutter * 2);
			$error.css({ width: width, left: gutter });

			var $message = $error.find('.site-error-message'),
				icon = message.icon || 'exclamation-triangle';

			$message.find('.icon-container').empty().append($('<span/>').addClass('fa fa-' + icon));
			$message.find('.error-content').html(message.message || message);

			$error.hide().slideDown('fast');
		},

		hideSiteError: function() {
			$('.site-error').slideUp('fast', function() {
				$(this).remove();
			});
		},

		getParameter: (function() {
			var cache = {};
			return function(name) {
				if ('getParameter' in window.location && typeof(window.location.getParameter) === 'function') {
					return window.location.getParameter(name);
				}

				var query = window.location.search.substring(1);
				if (cache[query]) {
					return cache[query][name];
				}

				var kvp = query.split('&'), values = {};
				for (var i = 0; i < kvp.length; i++) {
					var kv = kvp[i].split('=');
					values[kv[0]] = decodeURIComponent(kv[1] || '').replace(/\+/g, ' ');
				}

				cache[query] = values;
				return cache[query][name];
			};
		}())
	});

}(window, document, jQuery));
(function(window, document, $) {

	var app = window.jello;

	function loadJs(src, callback) {
		var script = window.document.createElement('script');
		script.setAttribute('src', src);
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('aysnc', 'true');
		if (callback) {
			script.onload = callback;
		}
		window.document.body.appendChild(script);
	}

	function loadStyleSheet(href) {
		$('<link/>').attr({
			type: 'text/css',
			rel: 'stylesheet',
			href: href
		}).appendTo('head');
	}

	function checkForStyleSheet(filename) {
		var styleSheets = window.document.styleSheets;
		for (var i = 0; i < styleSheets.length; i++) {
			if (styleSheets[i] && styleSheets[i].href && filename === styleSheets[i].href) {
				return true;
			}
		}

		return false;
	}

	app.View = Backbone.View.extend({
		localData: {},
		template: null,

		getDependencies: function() {
			return [];
		},

		loadDependencies: function(callback) {
			var dependencies = this.getDependencies();
			if (!dependencies.length) {
				callback();
				return;
			}

			var loaded = 0;

			function incrementAndCallback() {
				++loaded === dependencies.length && callback();
			}

			dependencies.forEach(function(dependency) {
				if (/\.css($|\?)/.test(dependency.file)) {
					if (checkForStyleSheet(dependency.file)) {
						incrementAndCallback();
						return;
					}

					loadStyleSheet(dependency.file);
					incrementAndCallback();
				} else if (/\.js($|\?)/.test(dependency.file)) {
					if (dependency.test()) {
						incrementAndCallback();
						return;
					}

					loadJs(dependency.file, function() {
						incrementAndCallback();
					});
				} else {
					throw new Error('Invalid dependency');
				}
			});
		},

		render: function() {
			var $loadingContainer = $('.page-load-progress-container').addClass('loading');
			function stopLoading() {
				$loadingContainer.removeClass('loading');
			}
			var self = this;
			this.fetchContent(function(err, content) {
				if (!content) {
					stopLoading();
					app.showSiteError('Failed to load page, <a href="" data-ignore>click here</a> to refresh');
					return;
				}

				if ('redirect' in content) {
					stopLoading();
					//TODO this should probably be a hard redirect so we don't break the back button so hard...
					app.navigate(content.redirect);
					return;
				}

				if (!('html' in content)) {
					stopLoading();
					app.showSiteError('Server response was malformed, <a href="" data-ignore>click here</a> to refresh');
					return;
				}

				if ('info' in content) {
					self.setMetaData(content.info);
				}

				self.setData(app.parseViewData(content.viewData));

				app.context.partials = {};

				if ('partials' in content) {
					for (var name in content.partials) {
						app.context.partials[name] = app.evaluateTemplate(content.partials[name]);
					}
				}

				self.$el.html(content.html).appendTo($('#main'));
				self.trigger('rendered');
				self.postRender(false);
				stopLoading();
			});
		},

		setData: function(data) {
			this.localData = data;
		},

		setMetaData: function(info) {
			document.title = info.title;
			$('head meta[name="description"], head meta[property="og:description"]')
				.attr('content', info.description);
			$('head meta[property="og:title"]').attr('content', info.title);
			$('head meta[property="og:type"]').attr('content', info.type);

			if (!info.image) {
				$('head meta[property="og:image"]').remove();
			} else {
				var $image = $('head meta[property="og:image"]');
				if (!$image.length) {
					$image = $('<meta/>').attr('property', 'og:image').appendTo('head');
				}
				$image.attr('content', info.image);
			}
		},

		fetchContent: function(callback) {
			var path = window.location.pathname + '.content';

			if (window.location.search) {
				path = path + window.location.search;
			}

			var count = 0, body, calledBack = false;

			function done(err, result) {
				if (result) {
					body = result;
				}
				if ((++count === 2 || err) && !calledBack) {
					calledBack = true;
					callback(err, body);
				}
			}

			this.loadDependencies(done);
			app.request.get(path, { dataType: 'json' }, done);
		},

		renderTemplate: function(template, callback) {
			callback(null, template(app.locals));
		},

		remove: function() {
			if ($(document).height() > $(window).height()) {
				$(document.body).addClass('vertical-scroll');
			}

			Backbone.View.prototype.remove.apply(this, arguments);
		},

		preRender: function() {},
		postRender: function(initialView) {
			$(document.body).removeClass('vertical-scroll');
			this.onPostRender(initialView);
		},

		onPostRender: function() {}
	});

}(window, document, jQuery));
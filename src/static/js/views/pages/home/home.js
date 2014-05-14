(function(app, $) {
	app.views.pages.home = app.View.extend({
		initialize: function() {
			console.log('Welcome home!');
		}
	});
}(window.jello, jQuery));
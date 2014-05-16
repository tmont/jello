(function(app, $) {
	app.views.pages.login = app.View.extend({
		initialize: function() {
			this.$('.login-form').form();
		}
	});
}(window.jello, jQuery));
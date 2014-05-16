/** @depends
 * jello-app.js
 * view.js
 * views/header.js
 */
(function(window, document, $) {

	$(document).ready(function() {
		var app = window.jello;

		// wire up logged in user
//		app.loggedInUser = new app.models.User(app.initData.loggedInUser);

		app.start(function() {
			app.views.header = new app.views.components.HeaderView({
				el: $('.site-header')[0]
			});

			app.views.header.setData(app.parseViewData(app.initData.globalData));
			app.views.header.postRender();
		});
	});

}(window, document, jQuery));
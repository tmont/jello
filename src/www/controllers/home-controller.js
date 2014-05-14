var goa = require('goa');

function HomeController(/** ControllerContext */context) {
	this.context = context;
}

HomeController.prototype = {
	index: function(params, send) {
		console.log(require('util').inspect(params, false, null, true));
		this.context.render('home/index', send);
	}
};

module.exports = HomeController;

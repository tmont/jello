var goa = require('goa');

function HomeController(/** ControllerContext */context) {
	this.context = context;
}

HomeController.prototype = {
	index: function(params, send) {
		send(goa.json({ hello: 'world' }));
	}
};

module.exports = HomeController;

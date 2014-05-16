function HomeController(/** ControllerContext */context) {
	this.context = context;
}

HomeController.prototype = {
	index: function(params, send) {
		this.context.render('home/index', send);
	}
};

module.exports = HomeController;

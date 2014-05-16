function AccountController(/** ControllerContext */context, /** AccountService */service) {
	this.context = context;
}

AccountController.prototype = {
	login: function(params, send) {
		if (this.context.req.isAuthenticated) {
			this.context.redirect('/', send);
			return;
		}

		this.context.render('account/login', send);
	},

	loginAttempt: function(params, send) {
		if (this.context.req.isAuthenticated) {
			this.context.redirect('/', send);
			return;
		}


	}
};

module.exports = AccountController;

var csurf = require('csurf');

module.exports = function(req, res, next) {
	if (req.session && req.session.user) {
//		//only enable CSRF if you have a session
		csurf()(req, res, next);
		return;
	}

	next();
};
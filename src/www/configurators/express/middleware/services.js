var path = require('path');

module.exports = function(req, res, next) {
	var container = req.container;

//	var root = path.join(container.resolveSync('AppRoot'), 'controllers/services'),
//		transactionInterceptor = container.resolveSync('TxInterceptor');

	next();
};

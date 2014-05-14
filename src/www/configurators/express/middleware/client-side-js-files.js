module.exports = function(addLocalToRequest) {
	return function (req, res, next) {
		var container = req.container;
		addLocalToRequest(req, 'jsFiles', container.resolveSync('ClientJsFiles'));
		next();
	}
};
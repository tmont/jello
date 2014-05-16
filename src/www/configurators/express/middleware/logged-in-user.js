var async = require('async'),
	sahara = require('sahara'),
	core = require('../../../../core'),
	User = core.models.User;

module.exports = function(addLocalToRequest) {
	return function(req, res, next) {
		var container = req.container;

		var userInfo = {
			user: new User(),
			roles: [],
			activeRosterEntries: [],
			rosterEntries: []
		};

		container.registerInstance(userInfo, 'UserInfo');
		addLocalToRequest(req, 'userInfo', userInfo);

		function loadUser(next) {
			if (!req.isAuthenticated) {
				next();
				return;
			}

			container.resolve('UserRepository', function(err, repo) {
				if (err) {
					next(err);
					return;
				}

				var options = { name: 'Logged in user' };
				repo.load(req.session.user.id, options, function(err, user) {
					if (err) {
						next(err);
						return;
					}

					if (!user) {
						req.session.user = null;
					} else {
						userInfo.user = user;
					}

					next();
				});
			});
		}

		async.series([ loadUser ], function(err) {
			container.registerInstance(userInfo.user, 'LoggedInUser', sahara.lifetime.memory());
			addLocalToRequest(req, 'loggedInUser', userInfo.user);
			next(err);
		});
	}
};
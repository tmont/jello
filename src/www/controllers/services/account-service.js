var core = require('../../../core'),
	User = core.models.User,
	moment = require('moment'),
	routes = require('../../routes'),
	util = require('util'),
	async = require('async');

function AccountService(
	/** UserRepository */userRepo,
	/** ResetPasswordTokenRepository */pwTokenRepository,
	/** LoggedInUser */loggedInUser,
	/** Tenant */tenant
) {
	this.userRepo = userRepo;
	this.pwTokenRepository = pwTokenRepository;
	this.loggedInUser = loggedInUser;
	this.affiliate = affiliate;
}

AccountService.prototype = {
	verifyLogin: function(email, password, callback) {
		var self = this;
		this.userRepo.findByEmail(email, function(err, user) {
			if (err) {
				callback(err);
				return;
			}

			if (!user || !user.testPassword(password)) {
				if (user) {
					self.tracker.trackFor(user, 'login failure');
				}

				callback({ invalid: true });
				return;
			}

			callback(null, user);
		});
	},

	// Implicitly register user for the current affiliate on login
	loginUser: function(user, session, callback) {
		var self = this;
		this.userRepo.registerUserForAffiliate(user, function(err) {
			if (err) {
				callback && callback(err);
				return;
			}

			session.user = user.toDto();

			self.tracker.setFor(user, {
				$first_name: user.firstName,
				$last_name: user.lastName,
				$created: user.created.format(),
				$email: user.email,
				Affiliate: self.affiliate.name
			});
			self.tracker.trackFor(user, 'login');
			callback && callback(null, user);
		});
	},

	createResetPasswordToken: function(email, callback) {
		var self = this;
		this.userRepo.exists(email, function(err, exists) {
			if (err) {
				callback(err);
				return;
			}

			var entity = new ResetPasswordToken({ email: email });
			if (!exists) {
				//if the user doesn't exist, we fake like they do so the
				//reset service isn't abused
				callback(null, entity);
				return;
			}

			self.pwTokenRepository.save(entity, function(err) {
				if (err) {
					callback(err);
					return;
				}

				var locals = {
					affiliateName: self.affiliate.name,
					links: {
						reset: routes.resetPasswordReturn.getUrl({ token: entity.token })
					}
				};

				self.tracker.track('password reset request', { email: email });

				callback(null, entity);
				self.mailer.sendResetPassword(email, locals);
			});
		});
	},

	getResetPasswordToken: function(token, callback) {
		this.pwTokenRepository.load(token, callback);
	},

	resetPasswordTo: function(token, newPassword, callback) {
		var self = this;
		this.pwTokenRepository.load(token, function(err, token) {
			if (err) {
				callback(err);
				return;
			}

			self.userRepo.findByEmail(token.email, function(err, user) {
				if (err || !user) {
					callback(err || { notFound: true });
					return;
				}

				//if they've gone through the reset password song and dance,
				//then that means their email address is valid
				user.validEmail = 1;
				user.changePassword(newPassword);

				self.userRepo.save(user, function(err, user) {
					if (!err) {
						self.tracker.track('password reset', { email: user.email });
					}

					callback(err, user);
				});
			});
		});
	},

	changePasswordTo: function(user, oldPassword, newPassword, callback) {
		if (!user.testPassword(oldPassword)) {
			callback({ invalidPassword: true });
			return;
		}

		user.changePassword(newPassword);
		var self = this;
		this.userRepo.save(user, function(err, user) {
			if (!err) {
				self.tracker.trackFor(user, 'password change');
			}

			callback(err, user);
		});
	},

	logout: function(session, callback) {
		if (session) {
			session.destroy();

			if (this.loggedInUser.id) {
				this.tracker.trackFor(this.loggedInUser, 'logout');
			}
		}

		callback();
	}
};

module.exports = AccountService;
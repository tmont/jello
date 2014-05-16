var JelloRepository = require('../jello-repository'),
	Repository = require('mesia').persistence.Repository,
	async = require('async'),
	util = require('util'),
	User = require('../models/user'),
	Tenant = require('../models/tenant');

function selectUsers(sql, tenant) {
	var _user = sql.user,
		_userTenant = sql.user_tenant_map;

	return _user
		.select(
			_user.star({ prefix: User.prefix })
		)
		.join(_userTenant).on(
			_userTenant.user_id.equals(_user.id).and(_userTenant.tenant_id.equals(tenant.id))
		);
}

function UserRepository(
	/** SqlExecutor */executor,
	/** Tenant */tenant,
	/** ValidatorFactory */ validatorFactory,
	/** JsonCache */cache) {
	JelloRepository.call(this, executor, User, cache, validatorFactory, tenant);
	this.tenant = tenant;
}

util.inherits(UserRepository, JelloRepository);

UserRepository.prototype.registerUserForTenant = function(user, callback) {
	var self = this;
	var _userTenant = this.sql.user_tenant_map;

	// check that the mapping exists, and if not, insert it.
	var checkMapQuery = _userTenant
		.select(1)
		.where(_userTenant.user_id.equals(user.id))
		.and(_userTenant.tenant_id.equals(self.tenant.id));

	self.execute(checkMapQuery, function(err, result) {
		if (err) {
			callback(err);
			return;
		}

		if (!result.length) {
			var insertMapQuery = _userTenant.insert({
				user_id: user.id,
				tenant_id: self.tenant.id
			});

			self.execute(insertMapQuery, callback);
			return;
		}

		callback(err);
	});
};

UserRepository.prototype.createIfNotExists = function(user, callback) {
	var self = this;

	function verifyEmail(next) {
		self.findByEmail(user.email, function(err, existingUser) {
			if (err) {
				next(err);
				return;
			}

			if (existingUser) {
				next({ duplicate: true }, existingUser);
				return;
			}

			next();
		});
	}

	function createUser(next) {
		self.save(user, next);
	}

	function registerForTenant(user, next) {
		self.registerUserForTenant(user, next);
	}

	async.series([ verifyEmail, createUser, registerForTenant ], function(err) {
		callback(err, user);
	});
};

UserRepository.prototype.getDeleteQuery = function(entity) {
	var _user = this.sql.user,
		_userTenant = this.sql.user_tenant_map;

	return _user.delete(_user)
		.from(_user
			.join(_userTenant).on(_userTenant.user_id.equals(_user.id))
		)
		.where(_user.id.equals(entity.id))
		.and(_userTenant.tenant_id.equals(this.tenant.id));
};

UserRepository.prototype.getUpdateQuery = function(entity) {
	var values = getValues(entity);
	var _user = this.sql.user;
	return _user.update(values).where(_user.id.equals(entity.id));
};

UserRepository.prototype.getInsertQuery = function(entity) {
	var values = getValues(entity);
	var _user = this.sql.user;
	values.created = entity.created.format('YYYY-MM-DD HH:mm:ss');
	return _user.insert(values);
};

UserRepository.prototype.getLoadQuery = function(id) {
	var _user = this.sql.user;
	return selectUsers(this.sql, this.tenant).where(_user.id.equals(id));
};

UserRepository.prototype.load = function(id, options, callback) {
	if (typeof(options) === 'function') {
		callback = options;
		options = {};
	}

	var self = this;

	function onHit(json, callback) {
		callback(null, User.create(json));
	}

	function onMiss(callback) {
		Repository.prototype.load.call(self, id, options, function(err, user) {
			if (err || !user) {
				callback(err);
				return;
			}

			self.getTenantsForUser(user, options, function(err, tenants) {
				if (err) {
					callback(err);
					return;
				}

				user.tenants = tenants;
				callback(err, user);
			});
		});
	}

	this.useCache('user:' + id, onMiss, onHit, callback);
};

//TODO this should be on the tenant repository
UserRepository.prototype.getTenantsForUser = function(user, options, callback) {
	var self = this;
	var _tenant = this.sql.tenant,
		_userTenant = this.sql.user_tenant_map;

	var query = _tenant
		.select(_tenant.star({ prefix: Tenant.prefix }))
		.from(_tenant
			.join(_userTenant).on(_tenant.id.equals(_userTenant.tenant_id))
		)
		.where(_userTenant.user_id.equals(user.id));

	if (typeof(options) === 'function') {
		callback = options;
		options = {};
	}

	if (options.name) {
		query._name = options.name;
	}

	self.executor.execute(query, function(err, result) {
		if (err) {
			callback(err);
			return;
		}

		var tenants = result.map(function(queryResult) {
			return Tenant.fromQueryResult(queryResult);
		});

		callback(err, tenants);
	});
};

UserRepository.prototype.exists = function(email, options, callback) {
	if (typeof(options) === 'function') {
		callback = options;
		options = {};
	}

	var _user = this.sql.user;
	var query = selectUsers(this.sql, this.tenant).where(_user.email.equals(email));
	this.execute(query, options, function(err, result) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, !!result[0]);
	});
};

UserRepository.prototype.findByEmail = function(email, callback) {
	var _user = this.sql.user;
	var query = selectUsers(this.sql, this.tenant).where(_user.email.equals(email));

    var self = this;
	this.executor.execute(query, function(err, result) {
		if (err || !result.length) {
			callback(err);
			return;
		}

		var user = self.createEntity(result[0]);

		self.getTenantsForUser(user, function(err, tenants) {
			if (err) {
				callback(err);
				return;
			}

			user.tenants = tenants;
			callback(err, user);
		});
	});
};

UserRepository.prototype.getAll = function(options, callback) {
	options = options || {};
	var offset = options.offset || 0,
		limit = options.limit || 20;

	var _user = this.sql.user;
	var query = selectUsers(this.sql, this.tenant).order(_user.last_name, _user.first_name);

	if (limit > 0) {
		query = query.limit(limit);
	}
	if (offset > 0) {
		query = query.offset(offset);
	}

	this.executeAndMapEntity(query, callback);
};

function getValues(entity) {
	return {
		email: entity.email,
		password: entity.password,
		first_name: entity.firstName,
		last_name: entity.lastName
	};
}

module.exports = UserRepository;
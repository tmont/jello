var	mesia = require('mesia'),
	JelloEntity = require('../jello-entity'),
	bcrypt = require('bcrypt'),
	moment = require('moment'),
	Tenant = require('./tenant'),
	util = require('util');

function User(data) {
	data = data || {};

	JelloEntity.call(this, data);

	this.id = data.id || null;
	this.email = data.email || '';
	this.password = data.password || '';
	this.firstName = data.firstName || '';
	this.lastName = data.lastName || '';
	this.tenants = (data.tenants || []).map(Tenant.create);
	this.created = JelloEntity.getDate(data.created);
}

JelloEntity.inherit(User);

User.fromQueryResult = function(data, prefix, tenant) {
	var dto = Entity.mapValues(data, prefix || User.prefix);
	return new User(dto);
};

util._extend(User.prototype, {
	getDisplayName: function() {
		return this.firstName ? [ this.firstName, this.lastName ].join(' ') : this.email;
	},

	changePassword: function(newPassword) {
		this.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync());
	},

	testPassword: function(password) {
		return bcrypt.compareSync(password, this.password);
	},

	getRealDtoProperties: function() {
		return [
			'id',
			'email',
			'firstName',
			'lastName'
		];
	},

	toFullDto: function() {
		var dto = this.toDto();
		dto.password = this.password;
		dto.tenants = this.tenants;
		return dto;
	}
});

module.exports = User;
var mesia = require('mesia'),
	Entity = mesia.persistence.Entity,
	moment = require('moment'),
	util = require('util');

function Tenant(data) {
	data = data || {};

	Entity.call(this, data);

	this.id = data.id || null;
	this.name = data.name || null;
}

Entity.inherit(Tenant);

Tenant.fromQueryResult = function(data, prefix) {
	var dto = Entity.mapValues(data, prefix || Tenant.prefix);
	return new Tenant(dto);
};

util._extend(Tenant.prototype, {
	getDisplayName: function() {
		return this.name;
	},

	getDtoProperties: function() {
		return [
			'id',
			'email',
			'firstName',
			'lastName',
			'tenants'
		];
	}
});

module.exports = Tenant;
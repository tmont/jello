var Entity = require('mesia').persistence.Entity,
	moment = require('moment'),
	util = require('util');

function JelloEntity(data) {
	Entity.call(this, data);
}

Entity.inherit(JelloEntity);

JelloEntity.prototype.getDtoProperties = function() {
	var self = this;

	return this.getRealDtoProperties().concat([
		{
			key: 'created',
			value: function() {
				return self.created.format('YYYY-MM-DD HH:mm:ss')
			}
		}
	]);
};

JelloEntity.prototype.getRealDtoProperties = function() {
	return [];
};

JelloEntity.inherit = function(ctor) {
	Entity.inherit(ctor, JelloEntity);
};
JelloEntity.mapValues = Entity.mapValues;

JelloEntity.getDate = function(date) {
	return date ? moment(date).utc() : moment().utc();
};

module.exports = JelloEntity;



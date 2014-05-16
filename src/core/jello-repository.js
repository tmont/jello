var Repository = require('mesia').persistence.Repository,
	util = require('util');

function JelloRepository(executor, type, cache, validatorFactory, tenant) {
	Repository.call(this, executor, type, cache, validatorFactory);
	this.tenant = tenant;
}

util.inherits(JelloRepository, Repository);

util._extend(JelloRepository.prototype, {
	useCache: function(key, onMiss, onHit, ttl, callback) {
		var tenantId = this.tenant ? this.tenant.id : '';
		key = JelloRepository.cachePrefix + tenantId + ':' + key;
		Repository.prototype.useCache.call(this, key, onMiss, onHit, ttl, callback);
	},

	createEntity: function(queryResult) {
		if (!this.type) {
			throw new Error('Repository.type is not set');
		}

		return this.type.fromQueryResult(queryResult, null, this.tenant || null);
	}
});

JelloRepository.cachePrefix = '';

module.exports = JelloRepository;
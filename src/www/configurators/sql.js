var sql = require('sql');

module.exports = function(container, libs, next) {
//	var sqlInstance = new sql.Sql('mysql');
//	var definitions = core.affiliate.schema(sqlInstance);
//	container.registerInstance(definitions, 'Sql', libs.sahara.lifetime.memory());
	next();
};
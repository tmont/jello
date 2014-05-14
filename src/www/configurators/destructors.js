var mesia = require('mesia');

/**
 * Configures destructors for the app
 *
 * Destructors are functions that are executed at the end
 * of each request. They are good for closing down connections
 * and general tear down of per-request state.
 */
module.exports = function(container, libs, next) {
	var sahara = libs.sahara;

	var destructors = [
		//closes the database connection
		mesia.web.destructors.db('DbConnection')

		//clears sahara's object manager
//		mesia.web.destructors.purge

		//deletes temporary files created by multiparty after file uploads
		//mesia.web.destructors.deleteTempFiles
	];

	container.registerInstance(destructors, 'Destructors', sahara.lifetime.memory());
	next();
};
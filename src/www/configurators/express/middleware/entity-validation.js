var core = require('../../../../core'),
	sahara = require('sahara');

module.exports = function(req, res, next) {
	var validators = core.validators,
		container = req.container;

	Object.keys(validators).forEach(function(key) {
		container.registerType(validators[key], key, sahara.lifetime.memory());
	});

	function createValidator(type, callback) {
		container.resolve(type.name + 'Validator', callback);
	}

	container.registerInstance(createValidator, 'ValidatorFactory', sahara.lifetime.memory());
	next();
};
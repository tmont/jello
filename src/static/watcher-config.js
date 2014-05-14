var path = require('path');

module.exports = {
	preRestart: 'cp /vagrant/src/static/app.js /var/www/sites/jello.local/src/static',
	locations: [
		{
			dir: path.join(__dirname, 'app.js'),
			options: {
				type: 'watchFile'
			}
		}
	],
	services: [
		'jello-static'
	]
};
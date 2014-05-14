var path = require('path');

function isDotFile(basename) {
	return basename.charAt(0) === '.';
}
function isNotJsFile(basename, stat) {
	return !/\.js$/.test(basename) && stat.isFile();
}

module.exports = {
	preRestart: 'rsync -vaz --delete --exclude config.json --exclude src/www/views --exclude src/static/fonts --exclude src/static/js --exclude src/static/css --exclude src/static/images /vagrant/src /vagrant/tests /var/www/sites/jello.local',
	locations: [
		{
			dir: __dirname,
			options: {
				type: 'watchFile',
				exclude: function(filename, stat) {
					var basename = path.basename(filename);
					return isDotFile(basename) || isNotJsFile(basename, stat);
				}
			}
		},

		//watch the core directory
		{
			dir: path.join(__dirname, '../core'),
			options: {
				type: 'watchFile',
				exclude: function(filename, stat) {
					var basename = path.basename(filename),
						ignoreDirs = { node_modules: 1, tests: 1 };

					return isDotFile(basename) ||
						(ignoreDirs[basename] && stat.isDirectory()) ||
						isNotJsFile(basename, stat);
				}
			}
		},

		//watch the routes definition
		{
			dir: path.join(__dirname, '../static/js/routes.js'),
			options: {
				type: 'watchFile'
			}
		}
	],
	services: [
		'jello-web'
	]
};
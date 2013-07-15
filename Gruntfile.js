var fs = require('fs'),
	pkg = require('./package.json'),
	gruntConfig = {
		pkg: pkg,
		watch: {
			styles: {
				files: [pkg.stylusPath + 'app.styl', pkg.stylusPath + '**/*.styl'],
				tasks: ['stylus:dev']
			}
		},
		stylus: {
			dev: {
				src: pkg.stylusPath + 'app.styl',
				dest: pkg.cssPath + 'main.css',
				options: {
					firebug: true,
					compress: false,
					urlfunc: 'embedurl'
				}
			},
			prod: {
				src: pkg.stylusPath + 'app.styl',
				dest: pkg.cssPath + 'main.min.css',
				options: {
					includecss: true,
					urlfunc: 'embedurl'
				}
			}
		},
		jshint: {
			lint: pkg.srcPath + '*.js',
			options: {
				indent: 4,
				undef: true, // Ругается на необъявленные переменные
				curly: true, // Обязует ставить { } при работе с if, for и т.д.
				forin: true, // Обязует использовать hasOwnProperty при работе с for in
				unused: true, // Ругается если переменная объявлена, но никогда не использовалась
				newcap: true, // Обязует все конструкторы называть с большой Буквы
				eqnull: true, // Отключает предупреждения при нестрогом сравнении с null (== null) 
				jquery: true, // Не ругается на jquery
				browser: true, // Не ругается на хостовые переменные браузера
				noempty: true, // Ругается если обнаружен пустой блок в js
				latedef: true, // Запрещает работать с переменными до того, как они были объявлены
				camelcase: true, // Все переменные должны быть только в camelCase
				quotmark: 'single', // Все ковычки должны быть одинарными
				globals: {
					module: true,
					require: true,
					console: true
				}
			}
		}
	};

module.exports = function(grunt) {
	// Инициализируем конфиг
	grunt.initConfig(gruntConfig);

	// Подключаем таски
	// grunt.loadNpmTasks('grunt-contrib-concat');
	// grunt.loadNpmTasks('grunt-contrib-uglify');
	// grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-stylus');

	// Регистрируем таски
	grunt.registerTask('default', 'watch');
	grunt.registerTask('compile', ['jshint', 'stylus:dev', 'stylus:prod']);
};

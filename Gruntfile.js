var fs = require('fs'),
	pkg = require('./package.json'),
	bannerTemplate = '/**\n' +
		' * <%= pkg.name %> - v<%= pkg.version %> (build date: <%= grunt.template.today("dd/mm/yyyy") %>)\n' +
		' * <%= pkg.url %>\n' +
		' * <%= pkg.description %>\n' +
		' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
		' * Licensed MIT\n' +
		' */\n',
	gruntConfig = {
		pkg: pkg,
		bumpup: {
			file: 'package.json'
		},
		watch: {
			styles: {
				files: pkg.stylusPath + 'main.styl',
				tasks: ['stylus:dev']
			}
		},
		stylus: {
			dev: {
				src: pkg.stylusPath + 'main.styl',
				dest: pkg.cssPath + 'main.css',
				options: {
					firebug: true,
					compress: false,
					urlfunc: 'embedurl'
				}
			},
			prod: {
				src: pkg.stylusPath + 'main.styl',
				dest: pkg.cssPath + 'main.min.css',
				options: {
					urlfunc: 'embedurl'
				}
			}
		},
		concat: {
			dev: {
				src: [pkg.srcPath + '*.js', pkg.srcPath + 'patches/*.js', pkg.srcPath + 'helpers/*.js', pkg.srcPath + 'logger/logger.js'],
				dest: pkg.buildPath + 'requirejs-sandbox.js',
				options: {
					banner: bannerTemplate
				}
			},
			prod: {
				src: [pkg.srcPath + '*.js', pkg.srcPath + 'patches/*.js', pkg.srcPath + 'helpers/*.js', pkg.srcPath + 'logger/fake.js'],
				dest: pkg.buildPath + 'requirejs-sandbox.js'
			}
		},
		uglify: {
			manager: {
				src: pkg.buildPath + 'requirejs-sandbox.js',
				dest: pkg.buildPath + 'requirejs-sandbox.min.js',
				options: {
					banner: bannerTemplate
				}
			}
		},
		qunit: {
			files: [pkg.testPath + '**/*.html']
		},
		jshint: {
			lint: [pkg.srcPath + '**/*.js', pkg.pluginPath + '**/*.js'],
			options: {
				indent: 4,
				boss: true, // Позволяет делать присвоение в условиях `if (a = true) { ... }`
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
				scripturl: true, // Позволяет в урле использовать конструкции типа `javascript:0`
				'-W030': false, // Expected an assignment or function call and instead saw an expression
				globals: {
					module: true,
					define: true,
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
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-bumpup');

	// Регистрируем кастомные таски
	grunt.registerTask('updatepkg', 'Update pkg version after bumpup.', function() {
		gruntConfig.pkg = grunt.file.readJSON('package.json');
		grunt.log.writeln('ok!');
	});

	// Регистрируем таски
	grunt.registerTask('default', 'watch');
	grunt.registerTask('tests', 'qunit');
	grunt.registerTask('travis', ['jshint', 'concat:prod', 'uglify:manager', 'concat:dev', 'qunit']);
	grunt.registerTask('build', ['stylus:dev', 'stylus:prod', 'bumpup:build', 'updatepkg', 'concat:prod', 'uglify:manager', 'concat:dev']);
	grunt.registerTask('compile', ['jshint', 'stylus:dev', 'stylus:prod', 'bumpup:build', 'updatepkg', 'concat:prod', 'uglify:manager', 'concat:dev', 'qunit']);
};

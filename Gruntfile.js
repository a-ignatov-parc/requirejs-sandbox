var fs = require('fs'),
	_ = require('underscore'),
	pkg = require('./package.json');

var bannerTemplate = '/**\n' +
		' * <%= pkg.name %> - v<%= pkg.version %> (build date: <%= grunt.template.today("dd/mm/yyyy") %>)\n' +
		' * <%= pkg.url %>\n' +
		' * <%= pkg.description %>\n' +
		' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
		' * Licensed MIT\n' +
		' */\n',
	wrapStart = _.template(fs.readFileSync(pkg.config.srcDir + '/wrappers/start.frag').toString()),
	wrapEnd = _.template(fs.readFileSync(pkg.config.srcDir + '/wrappers/end.frag').toString());

var buildOptions = {
		baseUrl: '<%= srcDir %>',
		name: '../<%= packagesDir %>/almond/almond',
		paths: {
			console: 'console/log',
			patches: '../<%= patchesDir %>',
			plugins: '../<%= pluginsDir %>'
		},
		include: [
			'sandbox-manager'
		],
		almond: true,
		wrap: {
			start: wrapStart({
				globalName: 'manager'
			}),
			end: wrapEnd({
				exportName: 'sandbox-manager'
			})
		},
		optimize: 'none',
		out: '<%= buildDir %>/requirejs-sandbox.js'
	},
	additionalBuildList = [
		'helpers/patch'
	],
	gruntConfig = {
		pkg: pkg,

		srcDir: '<%= pkg.config.srcDir %>',
		testDir: '<%= pkg.config.testDir %>',
		buildDir: '<%= pkg.config.buildDir %>',
		pluginsDir: '<%= pkg.config.pluginsDir %>',
		patchesDir: '<%= pkg.config.patchesDir %>',
		cssDir: '<%= pkg.config.cssDir %>',
		stylusDir: '<%= pkg.config.stylusDir %>',
		packagesDir: '<%= pkg.config.packagesDir %>',

		requirejs: {
			dev: {
				options: buildOptions
			},
			prod: {
				options: _.extend({}, buildOptions, {
					paths: _.extend({}, buildOptions.paths, {
						console: 'console/fake'
					}),
					optimize: 'uglify2',
					preserveLicenseComments: false,
					out: '<%= buildDir %>/requirejs-sandbox.min.js'
				})
			}
		},

		watch: {
			styles: {
				files: '<%= stylusDir %>/**/*.styl',
				tasks: ['stylus']
			},
			js: {
				files: '<%= srcDir %>/**/*.js',
				tasks: ['requirejs']
			}
		},

		stylus: {
			dev: {
				src: '<%= stylusDir %>/main.styl',
				dest: '<%= cssDir %>/main.css',
				options: {
					firebug: true,
					compress: false,
					urlfunc: 'embedurl'
				}
			},
			prod: {
				src: '<%= stylusDir %>/main.styl',
				dest: '<%= cssDir %>/main.min.css',
				options: {
					urlfunc: 'embedurl'
				}
			},
			label: {
				src: '<%= stylusDir %>/label.styl',
				dest: '<%= cssDir %>/label.css',
				options: {
					urlfunc: 'embedurl'
				}
			}
		},

		qunit: {
			all: ['<%= testDir %>/**/*.html']
		},

		usebanner: {
			banners: {
				options: {
					linebreak: false,
					banner: bannerTemplate
				},
				files: {
					src: ['<%= buildDir %>/requirejs-sandbox.js', '<%= buildDir %>/requirejs-sandbox.min.js']
				}
			}
		},

		bumpup: {
			file: 'package.json'
		},

		jshint: {
			grunt: {
				src: 'Gruntfile.js',
				options: {
					jshintrc: '.jshintrc'
				}
			},
			src: {
				src: '<%= srcDir %>/**/*.js',
				options: {
					jshintrc: '<%= srcDir %>/.jshintrc'
				}
			},
			plugins: {
				src: '<%= pluginsDir %>/**/*.js',
				options: {
					jshintrc: '<%= pluginsDir %>/.jshintrc'
				}
			},
			patches: {
				src: '<%= patchesDir %>/**/*.js',
				options: {
					jshintrc: '<%= patchesDir %>/.jshintrc'
				}
			},
			tests: {
				src: '<%= testDir %>/*.js',
				options: {
					jshintrc: '<%= testDir %>/.jshintrc'
				}
			}
		}
	};

// Создаем список патчей для процессинга.
fs.readdirSync(pkg.config.patchesDir).forEach(function(file) {
	var path = pkg.config.patchesDir + '/' + file,
		rawFileName = file.split('.'),
		fileExtension = rawFileName.pop(),
		fileName = rawFileName.join('');

	if (file.indexOf('.') !== 0 && !fs.statSync(path).isDirectory()) {
		gruntConfig.requirejs[fileName + '-patch-dev'] = {
			options: _.extend({}, buildOptions, {
				include: ['patches/' + fileName],
				wrap: {
					start: wrapStart({
						globalNamespace: 'patches',
						globalName: fileName
					}),
					end: wrapEnd({
						exportName: 'patches/' + fileName
					})
				},
				out: '<%= buildDir %>/requirejs-sandbox/patches/' + fileName + '.' + fileExtension
			})
		};

		gruntConfig.requirejs[fileName + '-patch-prod'] = {
			options: _.extend({}, buildOptions, {
				include: ['patches/' + fileName],
				paths: _.extend({}, buildOptions.paths, {
					console: 'console/fake'
				}),
				wrap: {
					start: wrapStart({
						globalNamespace: 'patches',
						globalName: fileName
					}),
					end: wrapEnd({
						exportName: 'patches/' + fileName
					})
				},
				optimize: 'uglify2',
				preserveLicenseComments: false,
				out: '<%= buildDir %>/requirejs-sandbox/patches/' + fileName + '.min.' + fileExtension
			})
		};
	}
});

// Создаем список плагинов для процессинга.
fs.readdirSync(pkg.config.pluginsDir).forEach(function(file) {
	var path = pkg.config.pluginsDir + '/' + file,
		rawFileName = file.split('.'),
		fileExtension = rawFileName.pop(),
		fileName = rawFileName.join('');

	if (file.indexOf('.') !== 0 && !fs.statSync(path).isDirectory()) {
		gruntConfig.requirejs[fileName + '-plugin-dev'] = {
			options: _.extend({}, buildOptions, {
				include: ['plugins/' + fileName],
				wrap: {
					start: wrapStart({
						globalNamespace: 'plugins',
						globalName: fileName
					}),
					end: wrapEnd({
						exportName: 'plugins/' + fileName
					})
				},
				out: '<%= buildDir %>/requirejs-sandbox/plugins/' + fileName + '.' + fileExtension
			})
		};

		gruntConfig.requirejs[fileName + '-plugin-prod'] = {
			options: _.extend({}, buildOptions, {
				include: ['plugins/' + fileName],
				paths: _.extend({}, buildOptions.paths, {
					console: 'console/fake'
				}),
				wrap: {
					start: wrapStart({
						globalNamespace: 'plugins',
						globalName: fileName
					}),
					end: wrapEnd({
						exportName: 'plugins/' + fileName
					})
				},
				optimize: 'uglify2',
				preserveLicenseComments: false,
				out: '<%= buildDir %>/requirejs-sandbox/plugins/' + fileName + '.min.' + fileExtension
			})
		};
	}
});

additionalBuildList.forEach(function(modulePath) {
	var modulePathParts = modulePath.split('/'),
		namespace = modulePathParts.length > 1 ? modulePathParts[0] : null,
		name = modulePathParts[modulePathParts.length - 1];

	gruntConfig.requirejs[modulePath.replace('/', '-') + '-dev'] = {
		options: _.extend({}, buildOptions, {
			include: [modulePath],
			wrap: {
				start: wrapStart({
					globalNamespace: namespace,
					globalName: name
				}),
				end: wrapEnd({
					exportName: modulePath
				})
			},
			out: '<%= buildDir %>/requirejs-sandbox/' + modulePath + '.js'
		})
	};

	gruntConfig.requirejs[modulePath.replace('/', '-') + '-prod'] = {
		options: _.extend({}, buildOptions, {
			include: [modulePath],
			paths: _.extend({}, buildOptions.paths, {
				console: 'console/fake'
			}),
			wrap: {
				start: wrapStart({
					globalNamespace: namespace,
					globalName: name
				}),
				end: wrapEnd({
					exportName: modulePath
				})
			},
			optimize: 'uglify2',
			preserveLicenseComments: false,
			out: '<%= buildDir %>/requirejs-sandbox/' + modulePath + '.min.js'
		})
	};
});

module.exports = function(grunt) {
	// Инициализируем конфиг
	grunt.initConfig(gruntConfig);

	// Подключаем таски
	grunt.loadNpmTasks('grunt-bumpup');
	grunt.loadNpmTasks('grunt-banner');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-requirejs');

	// Регистрируем кастомные таски
	grunt.registerTask('updatepkg', 'Update pkg version after bumpup.', function() {
		gruntConfig.pkg = grunt.file.readJSON('package.json');
		grunt.log.writeln('ok!');
	});

	// Регистрируем таски
	grunt.registerTask('default', 'watch');
	grunt.registerTask('tests', 'qunit');
	grunt.registerTask('bower', ['requirejs', 'usebanner']);
	grunt.registerTask('travis', ['jshint', 'requirejs', 'usebanner', 'qunit']);
	grunt.registerTask('build', ['stylus', 'bumpup:build', 'updatepkg', 'requirejs', 'usebanner']);
	grunt.registerTask('compile', ['jshint', 'stylus', 'bumpup:prerelease', 'updatepkg', 'requirejs', 'usebanner', 'qunit']);
};

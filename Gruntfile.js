var fileSystem = require('fs'),
	pkg = require('./package.json'),
	bannerTemplate = '/**\n' +
		' * <%= pkg.name %> - v<%= pkg.version %> (build date: <%= grunt.template.today("dd/mm/yyyy") %>)\n' +
		' * <%= pkg.url %>\n' +
		' * <%= pkg.description %>\n' +
		' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
		' * Licensed MIT\n' +
		' */\n',
	dependenciesRegex = /define\(\[([^\]]+)\]/,
	processedDependenciesRegex = /define\(['"][^'"]+['"],\s?\[([^\]]+)\]/,
	getModulePreprocessor = function(isBeforeRead, isPatch) {
		return function(moduleName, path, contents) {
			var match = contents.match(isBeforeRead || isPatch ? dependenciesRegex : processedDependenciesRegex) || [],
				matchedDeps = match[1],
				deps = matchedDeps ? matchedDeps
					.replace(/\n?\t?/g, '')
					.replace(/['"]/g, '')
					.split(',') : false,
				bodyStartIndex = contents.indexOf('function'),
				processedContent = 'define(';

			if (!isBeforeRead) {
				processedContent += '\'';

				switch(moduleName) {
					case 'sandbox-manager':
						processedContent += 'requirejs-sandbox';
						break;
					case 'logger/fake':
						processedContent += 'requirejs-sandbox/logger/logger';
						break;
					default:
						processedContent += 'requirejs-sandbox/' + (isPatch ? 'patches/' : '') + moduleName;
				}
				processedContent += '\'';
			}

			if (deps) {
				if (isBeforeRead) {
					processedContent += '[';
				} else {
					processedContent += ',[';
				}

				for (var i = 0, length = deps.length; i < length; i++) {
					if (i) {
						processedContent += ',';
					}

					if (isBeforeRead) {
						processedContent += '\'' + (deps[i] == 'logger/logger' ? 'logger/fake' : deps[i]) + '\'';
					} else {
						processedContent += '\'requirejs-sandbox/' + (deps[i] == 'logger/fake' ? 'logger/logger' : deps[i]) + '\'';
					}
				}
				processedContent += '],';
			} else if (!isBeforeRead) {
				processedContent += ',';
			}

			processedContent += contents.substr(bodyStartIndex);
			return processedContent;
		};
	},
	gruntConfig = {
		pkg: pkg,
		srcDir: '<%= pkg.config.srcDir %>',
		testDir: '<%= pkg.config.testDir %>',
		buildDir: '<%= pkg.config.buildDir %>',
		pluginsDir: '<%= pkg.config.pluginsDir %>',
		patchesDir: '<%= pkg.config.patchesDir %>',
		cssDir: '<%= pkg.config.cssDir %>',
		stylusDir: '<%= pkg.config.stylusDir %>',
		bumpup: {
			file: 'package.json'
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
		uglify: {
			plugins: {
				files : {}
			}
		},
		qunit: {
			all: ['<%= testDir %>/**/*.html']
		},
		requirejs: {
			dev: {
				options: {
					baseUrl: '<%= srcDir %>',
					name: 'sandbox-manager',
					include: ['helpers/patch', 'helpers/processor/prefix'],
					optimize: 'none',
					out: '<%= buildDir %>/requirejs-sandbox.js',
					onBuildWrite: getModulePreprocessor()
				}
			},
			prod: {
				options: {
					baseUrl: '<%= srcDir %>',
					name: 'sandbox-manager',
					include: ['helpers/patch', 'helpers/processor/prefix'],
					optimize: 'uglify2',
					out: '<%= buildDir %>/requirejs-sandbox.min.js',
					onBuildRead: getModulePreprocessor(true),
					onBuildWrite: getModulePreprocessor()
				}
			}
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

// Создаем список плугинов для их минификации.
fileSystem
	.readdirSync(pkg.config.pluginsDir)
	.forEach(function(file) {
		var path = pkg.config.pluginsDir + '/' + file,
			rawFileName = file.split('.'),
			fileExtension = rawFileName.pop(),
			fileName = rawFileName.join('');

		if (file.indexOf('.') !== 0 && !fileSystem.statSync(path).isDirectory()) {
			gruntConfig.uglify.plugins.files['<%= buildDir %>/plugins/' + fileName + '.min.' + fileExtension] = path;
		}
	});

// Создаем список патчей для их процессинга.
fileSystem
	.readdirSync(pkg.config.patchesDir)
	.forEach(function(file) {
		var path = pkg.config.patchesDir + '/' + file,
			rawFileName = file.split('.'),
			fileExtension = rawFileName.pop(),
			fileName = rawFileName.join('');

		if (file.indexOf('.') !== 0 && !fileSystem.statSync(path).isDirectory()) {
			gruntConfig.requirejs[fileName + '_patch'] = {
				options: {
					baseUrl: '<%= patchesDir %>',
					name: fileName,
					optimize: 'none',
					out: '<%= buildDir %>/patches/' + fileName + '.' + fileExtension,
					onBuildRead: getModulePreprocessor(false, true)
				}
			};

			gruntConfig.requirejs[fileName + '_patch_min'] = {
				options: {
					baseUrl: '<%= patchesDir %>',
					name: fileName,
					optimize: 'uglify2',
					out: '<%= buildDir %>/patches/' + fileName + '.min.' + fileExtension,
					onBuildRead: getModulePreprocessor(false, true)
				}
			};
		}
	});

module.exports = function(grunt) {
	// Инициализируем конфиг
	grunt.initConfig(gruntConfig);

	// Подключаем таски
	grunt.loadNpmTasks('grunt-bumpup');
	grunt.loadNpmTasks('grunt-banner');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
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
	grunt.registerTask('bower', ['requirejs', 'uglify', 'usebanner']);
	grunt.registerTask('travis', ['jshint', 'requirejs', 'uglify', 'usebanner', 'qunit']);
	grunt.registerTask('build', ['stylus', 'bumpup:build', 'updatepkg', 'requirejs', 'uglify', 'usebanner']);
	grunt.registerTask('compile', ['jshint', 'stylus', 'bumpup:prerelease', 'updatepkg', 'requirejs', 'uglify', 'usebanner', 'qunit']);
};

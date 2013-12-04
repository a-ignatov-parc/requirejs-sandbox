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
	getModulePreprocessor = function(isBeforeRead) {
		return function(moduleName, path, contents) {
			var match = contents.match(isBeforeRead ? dependenciesRegex : processedDependenciesRegex) || [],
				matchedDeps = match[1],
				deps = matchedDeps ? matchedDeps
					.replace(/\n?\t?/g, '')
					.replace(/['"]/g, '')
					.split(',') : false,
				bodyStartIndex = contents.indexOf('function'),
				processedContent = 'define(';

			if (!isBeforeRead) {
				processedContent += '\'';

				if (moduleName == 'sandbox-manager') {
					processedContent += 'requirejs-sandbox';
				} else {
					processedContent += 'requirejs-sandbox/' + moduleName;
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
						processedContent += '\'requirejs-sandbox/' + deps[i] + '\'';
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
		uglify: {
			plugins: {
				files : {}
			}
		},
		qunit: {
			files: [pkg.testPath + '**/*.html']
		},
		requirejs: {
			dev: {
				options: {
					baseUrl: pkg.srcPath,
					name: 'sandbox-manager',
					optimize: 'none',
					out: pkg.buildPath + 'requirejs-sandbox.js',
					onBuildWrite: getModulePreprocessor()
				}
			},
			prod: {
				options: {
					baseUrl: pkg.srcPath,
					name: 'sandbox-manager',
					optimize: 'uglify2',
					out: pkg.buildPath + 'requirejs-sandbox.min.js',
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
					src: [pkg.buildPath + 'requirejs-sandbox.js', pkg.buildPath + 'requirejs-sandbox.min.js']
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
				src: pkg.srcPath + '**/*.js',
				options: {
					jshintrc: pkg.srcPath + '.jshintrc'
				}
			},
			plugins: {
				src: pkg.pluginPath + '**/*.js',
				options: {
					jshintrc: pkg.pluginPath + '.jshintrc'
				}
			},
			tests: {
				src: pkg.testPath + '*.js',
				options: {
					jshintrc: pkg.testPath + '.jshintrc'
				}
			}
		}
	};

// Создаем список плугинов для их минификации.
fileSystem
	.readdirSync(pkg.pluginPath)
	.forEach(function(file) {
	var path = pkg.pluginPath + file,
		rawFileName = file.split('.'),
		fileExtension = rawFileName.pop(),
		fileName = rawFileName.join('');

	if (file.indexOf('.') !== 0 && !fileSystem.statSync(path).isDirectory()) {
		gruntConfig.uglify.plugins.files[pkg.buildPath + 'plugins/' + fileName + '.min.' + fileExtension] = path;
	}
});

module.exports = function(grunt) {
	// Инициализируем конфиг
	grunt.initConfig(gruntConfig);

	// Подключаем таски
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-bumpup');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-banner');

	// Регистрируем кастомные таски
	grunt.registerTask('updatepkg', 'Update pkg version after bumpup.', function() {
		gruntConfig.pkg = grunt.file.readJSON('package.json');
		grunt.log.writeln('ok!');
	});

	// Регистрируем таски
	grunt.registerTask('default', 'watch');
	grunt.registerTask('tests', 'qunit');
	grunt.registerTask('travis', ['jshint', 'requirejs', 'uglify', 'usebanner', 'qunit']);
	grunt.registerTask('build', ['stylus:dev', 'stylus:prod', 'bumpup:build', 'updatepkg', 'requirejs', 'uglify', 'usebanner']);
	grunt.registerTask('compile', ['jshint', 'stylus:dev', 'stylus:prod', 'bumpup:build', 'updatepkg', 'requirejs', 'uglify', 'usebanner', 'qunit']);
};

module.exports = function(grunt) {
	grunt.registerTask('unrequire', 'Build task for removing require wrappers from build file.', function() {
		var config = grunt.config.get('unrequire'),
			burrito = require('burrito');

		console.log(config);

		if (grunt.file.exists(config.src)) {
			var fileString = grunt.file.read(config.src),
				currentTarget = 'define',
				currentModule = null,
				structure = [];

			grunt.log.writeln('Creating file structure');

			burrito(fileString, function(node) {
				switch(currentTarget) {
					case 'define':
						switch(node.label()) {
							case 'define':
								currentTarget = 'name';
								console.log('find define');
								break;
							case 'require':
							case 'requirejs':
								break;
						}
						break;
					case 'name':
						currentModule = {
							name: node.value[0],
							deps: [],
							handler: null
						};
						structure.push(currentModule);
						currentTarget = 'handler';
						console.log('find name', '"' + node.value[0] + '"');
						break;
					case 'dependency':
						var hasBreak = true;

						switch(node.name) {
							case 'string':
								currentModule.deps.push(node.value[0]);
								console.log('find dependency', '"' + node.value[0] + '"');
								break;
							case 'function':
								hasBreak = false;
								break;
						}

						if (hasBreak) {
							break;
						}
					case 'handler':
						switch(node.name) {
							case 'array':
								currentTarget = 'dependency';
								break;
							case 'function':
								currentModule.handler = node.source();
								currentTarget = 'define';
								console.log('find handler');
								break;
						}
						break;
				}
			});

			grunt.log.ok('Structure was created');
			console.log(structure);
			grunt.log.writeln('Creating new file string from structure');

			var newFileString = '(function(__export_target){',
				injectedDeps = {};

			for (var moduleIndex = 0, skipDeps = true;!0;) {
				var item = structure[moduleIndex],
					canInject = true;

				if (item != null) {
					if (item.deps.length && skipDeps) {
						moduleIndex++;
					} else {
						if (!skipDeps) {
							for (var i = 0, length = item.deps.length; i < length; i++) {
								if (!injectedDeps[item.deps[i]]) {
									canInject = false;
									break;
								}
							};
						}

						if (canInject) {
							newFileString += 'var ' + item.name + '=' + item.handler + '(' + item.deps.join(',') + ');'
							injectedDeps[item.name] = true;
							structure.splice(moduleIndex, 1);
							moduleIndex = 0;
						} else {
							moduleIndex++;
						}
					}
				} else {
					if (structure.length) {
						skipDeps = false;
						moduleIndex = 0;
					} else {
						break;
					}
				}
			};

			if (config.options.exportModule) {
				newFileString += '__export_target["' + (config.options.exportModuleName || config.options.exportModule) + '"]=' + config.options.exportModule + ';';
			}
			newFileString += '})(' + (config.options.exportTarget || 'window') + ');';

			grunt.log.ok('New file string was created');
			console.log(newFileString);

			grunt.file.write(config.dest, newFileString);
			grunt.log.ok('New file string was writen to file: ' + config.dest);
		}
	});
};

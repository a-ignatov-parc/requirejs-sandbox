module.exports = function(grunt) {
	grunt.registerTask('unrequire', 'Build task for removing require wrappers from build file.', function() {
		var config = grunt.config.get('unrequire'),
			burrito = require('burrito'),
			fileString;

		// console.log(grunt);
		console.log(config);

		if (grunt.file.exists(config.src)) {
			fileString = grunt.file.read(config.src);

			console.log(burrito);

			var src = burrito(fileString, function(node) {
				// console.log('node', node);

				if (node.name == 'call' && node.start.type == 'name') {
					switch(node.start.value) {
						case 'define':
							var argsAST = node.value[1];

							// node.wrap('catchDefine(%s)');

							console.log('define', node.value);

							for (var i = 0, length = argsAST.length; i < length; i++) {
								console.log('define value', argsAST[i]);
							};
							break;
						case 'require':
						case 'requirejs':
							// node.wrap('catchRequire(%s)');
							break;
					}
				}
			});

			// console.log(src);

			// grunt.file.write(config.dest, fileString);
		}
	});
};

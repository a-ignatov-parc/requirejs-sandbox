module.exports = function(grunt) {
	grunt.registerTask('unrequire', 'Build task for removing require wrappers from build file.', function() {
		var config = grunt.config.get('unrequire'),
			fileString;

		// console.log(grunt);
		console.log(config);

		if (grunt.file.exists(config.src)) {
			fileString = grunt.file.read(config.src);

			grunt.file.write(config.dest, fileString);
		}
	});
};

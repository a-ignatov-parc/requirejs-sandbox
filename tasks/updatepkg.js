module.exports = function(grunt) {
	grunt.registerTask('updatepkg', 'Update pkg version after bumpup.', function() {
		grunt.config.set('pkg', grunt.file.readJSON('package.json'));
		grunt.log.writeln('ok!');
	});
};

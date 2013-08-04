var qunit = require('qunit'),
	pkg = require('./package.json');

qunit.run({
	code: {
		path: pkg.main,
		namespace: pkg.name
	},
	tests: ['requirejs-sandbox.test.js'].map(function (testFile) {
		return './' + pkg.testPath + testFile;
	})
});

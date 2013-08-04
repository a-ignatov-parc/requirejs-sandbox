var qunit = require('qunit'),
	pkg = require('./package.json');

qunit.run({
	code: {
		path: pkg.main,
		namespace: pkg.name
	},
	tests: ['mylib.test.js'].map(function (v) {
		return './test/' + v;
	})
});

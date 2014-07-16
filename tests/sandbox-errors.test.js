requirejs(['requirejs-sandbox'], function(requirejsSandbox) {
	QUnit.start();

	var wrongTestSandbox = requirejsSandbox.set('WrongTest', {
		requireUrl: 'fake/url',
		success: function() {
			var sandboxApi = this;

			test('Creating sandbox with failure requireUrl', function() {
				equal(sandboxApi, wrongTestSandbox, 'callback has wrong context');
				equal(typeof(sandboxApi), 'object', 'WrongTest can\'t be found');
				strictEqual(sandboxApi.status, 3, 'WrongTest has wrong status! This test should use error hadler!!!');
			});
		},
		error: function() {
			var sandboxApi = this;

			test('Creating sandbox with failure requireUrl', function() {
				var sandbox;

				equal(sandboxApi, wrongTestSandbox, 'callback has wrong context');
				equal(typeof(sandboxApi), 'object', 'WrongTest can\'t be found');
				strictEqual(sandboxApi.status, 3, 'WrongTest has wrong status');

				requirejsSandbox.destroy('WrongTest');
				sandbox = requirejsSandbox.get(sandboxApi.name);

				equal(typeof(sandbox), 'undefined', 'requirejs-sandbox returned deleted sandbox');
				equal(Object.keys(sandboxApi).length, 0, 'sandbox api has wrong methods count');
				equal(Object.keys(wrongTestSandbox).length, 0, 'sandbox api has wrong methods count');
			});

			requirejsSandbox.set('SuccessTest', {
				success: function() {
					var sandboxApi = this;

					test('Recreating sandbox with url resolver', function() {
						equal(typeof(sandboxApi), 'object', 'SuccessTest can\'t be found');
						strictEqual(sandboxApi.status, 0, 'SuccessTest has wrong status');
					});
				}
			});
		}
	});
});

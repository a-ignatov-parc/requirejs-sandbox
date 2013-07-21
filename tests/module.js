asyncTest('loading requirejs-sandbox module', 1, function() {
	start();
	requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
		ok(true, 'module has been loaded');

		test('check requirejs-sandbox api', function() {
			equal(typeof(requrejsSandbox), 'object', 'requirejs-sandbox api is undefined');
			equal(Object.keys(requrejsSandbox).length, 3, 'requirejs-sandbox api has wrong methods count');
			equal(typeof(requrejsSandbox.get), 'function', 'get method is undefined');
			equal(typeof(requrejsSandbox.set), 'function', 'set method is undefined');
			equal(typeof(requrejsSandbox.destroy), 'function', 'destroy method is undefined');
		});

		test('creating sandbox with name: Test', function() {
			equal(typeof(requrejsSandbox.set()), 'undefined', 'requirejs-sandbox returned value when it should not');
			equal(typeof(requrejsSandbox.set('Test')), 'undefined', 'requirejs-sandbox returned value when it should not');

			var sandbox = requrejsSandbox.set('Test', {
				requireUrl: '../static/js/libs/require.min.js'
			});

			equal(typeof(sandbox), 'object', 'sandbox api has not been returned');
			equal(Object.keys(sandbox).length, 4, 'sandbox api has wrong methods count');
			equal(sandbox.name, 'Test', 'sandbox has wrong name');
			equal(typeof(sandbox.status), 'number', 'status property is not number');
			strictEqual(sandbox.status, -1, 'sandbox has wrong status');
			equal(sandbox.require, null, 'require.js function is defined before loaded');
			equal(typeof(sandbox.destroy), 'function', 'destroy method is undefined');

			var anotherSandbox = requrejsSandbox.set('Test', {});

			equal(typeof(anotherSandbox), 'object', 'anotherSandbox api has not been returned');
			equal(anotherSandbox, sandbox, 'requirejs-sandbox returned wrong sandbox instance');
		});

		var callbackTestSandbox = requrejsSandbox.set('CallbackTest', {
			requireUrl: '../static/js/libs/require.min.js',
			callback: function(require) {
				var self = this,
					context = callbackTestSandbox;

				test('testing created sandbox', function() {
					var sandbox;

					equal(self, context, 'callback has wrong context');
					equal(typeof(require), 'function', 'sandbox require.js is undefined');

					self.destroy();
					sandbox = requrejsSandbox.get(self.name);

					equal(typeof(sandbox), 'undefined', 'requirejs-sandbox returned deleted sandbox');
					equal(Object.keys(self).length, 0, 'sandbox api has wrong methods count');
					equal(Object.keys(context).length, 0, 'sandbox api has wrong methods count');
				});
			}
		});

		var wrongTestSandbox = requrejsSandbox.set('WrongTest', {
			callback: function(require) {
				var self = this;

				test('creating sandbox without specifying requireUrl', function() {
					var sandbox;

					equal(self, wrongTestSandbox, 'callback has wrong context');
					equal(typeof(require), 'undefined', 'require.js can\'t be created without specifying requireUrl');
					equal(typeof(self), 'object', 'WrongTest can\'t be found');
					strictEqual(self.status, 0, 'WrongTest has wrong status');

					requrejsSandbox.destroy('WrongTest');
					sandbox = requrejsSandbox.get(self.name);

					equal(typeof(sandbox), 'undefined', 'requirejs-sandbox returned deleted sandbox');
					equal(Object.keys(self).length, 0, 'sandbox api has wrong methods count');
					equal(Object.keys(wrongTestSandbox).length, 0, 'sandbox api has wrong methods count');
				});
			}
		});
	});
});

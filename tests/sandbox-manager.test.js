requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
	QUnit.start();

	test('Check requirejs-sandbox api', function() {
		equal(typeof(requrejsSandbox), 'object', 'requirejs-sandbox api is undefined');
		equal(Object.keys(requrejsSandbox).length, 4, 'requirejs-sandbox api has wrong methods count');
		equal(typeof(requrejsSandbox.get), 'function', 'get method is undefined');
		equal(typeof(requrejsSandbox.set), 'function', 'set method is undefined');
		equal(typeof(requrejsSandbox.destroy), 'function', 'destroy method is undefined');
		equal(typeof(requrejsSandbox._getSandboxConstructor), 'function', '_getSandboxConstructor private method is undefined');
	});

	test('Creating sandbox with name: Test', function() {
		equal(typeof(requrejsSandbox.set()), 'undefined', 'requirejs-sandbox returned value when it should not');
		equal(typeof(requrejsSandbox.set(123)), 'undefined', 'requirejs-sandbox returned value when it should not');
		equal(typeof(requrejsSandbox.set(true)), 'undefined', 'requirejs-sandbox returned value when it should not');
		equal(typeof(requrejsSandbox.set({ name: 'Test' })), 'undefined', 'requirejs-sandbox returned value when it should not');

		var sandbox = requrejsSandbox.set('Test');

		equal(typeof(sandbox), 'object', 'sandbox api has not been returned');
		equal(Object.keys(sandbox).length, 5, 'sandbox api has wrong methods count');
		equal(sandbox.name, 'Test', 'sandbox has wrong name');
		equal(typeof(sandbox.status), 'number', 'status property is not number');
		strictEqual(sandbox.status, -1, 'sandbox has wrong status');
		equal(sandbox.require, null, '"require" function is defined before loaded');
		equal(sandbox.define, null, '"define" function is defined before loaded');
		equal(typeof(sandbox.destroy), 'function', 'destroy method is undefined');

		var anotherSandbox = requrejsSandbox.set('Test');

		equal(typeof(anotherSandbox), 'object', 'anotherSandbox api has not been returned');
		equal(anotherSandbox, sandbox, 'requirejs-sandbox returned wrong sandbox instance');
	});

	var callbackTestSandbox = requrejsSandbox.set('CallbackTest', {
		success: function(require, define) {
			var sandboxApi = this,
				args = arguments,
				context = callbackTestSandbox;

			test('Testing created sandbox', function() {
				var sandbox;

				equal(sandboxApi, context, 'callback has wrong context');
				equal(typeof(require), 'function', 'sandbox require.js "require" function is undefined');
				equal(typeof(define), 'function', 'sandbox require.js "define" function is undefined');
				equal(require, context.require, 'sandbox api "require" method is not equal to arguments "require" function');
				equal(define, context.define, 'sandbox api "define" method is not equal to arguments "define" function');
				equal(args.length, 2, 'sandbox callback function\'s arguments has wrong count');

				equal(sandboxApi.name, 'CallbackTest', 'sandbox has wrong name');
				equal(typeof(sandboxApi.status), 'number', 'status property is not number');
				strictEqual(sandboxApi.status, 0, 'sandbox has wrong status');
				equal(typeof(sandboxApi.require), 'function', '"require" method is not defined');
				equal(typeof(sandboxApi.define), 'function', '"define" method is not defined');
				equal(typeof(sandboxApi.destroy), 'function', 'destroy method is undefined');

				sandboxApi.destroy();
				sandbox = requrejsSandbox.get(sandboxApi.name);

				equal(typeof(sandbox), 'undefined', 'requirejs-sandbox returned deleted sandbox');
				equal(Object.keys(sandboxApi).length, 0, 'sandbox api has wrong methods count');
				equal(Object.keys(context).length, 0, 'sandbox api has wrong methods count');
			});
		}
	});

	var exports = {
			export1: 'abc',
			export2: 123,
			export3: function() {
				return true;
			},
			export4: null
		};

	requrejsSandbox.set('ExportsTest', {
		debug: true,
		sandboxLinks: exports,
		success: function(require) {
			var sandboxApi = this;

			test('Checking exported variables', function() {
				for (var key in exports) {
					if (exports.hasOwnProperty(key)) {
						notEqual(typeof(sandboxApi.sandboxManager.sandbox[key]), 'undefined', 'Exported variable should not be undefined');
						equal(exports[key], sandboxApi.sandboxManager.sandbox[key], 'Exported value has wrong value');
					}
				}
			});

			test('Checking sandbox public api', function() {
				equal(typeof(sandboxApi.sandboxManager.sandbox.sandboxApi), 'object', 'Sandbox public api should be available');
				equal(sandboxApi.sandboxManager.sandbox.sandboxApi.name, sandboxApi.name, 'Sandbox public api has wrong value');
				equal(sandboxApi.sandboxManager.sandbox.sandboxApi.status, sandboxApi.status, 'Sandbox public api has wrong value');
				equal(sandboxApi.sandboxManager.sandbox.sandboxApi.require, sandboxApi.require, 'Sandbox public api has wrong value');
				equal(sandboxApi.sandboxManager.sandbox.sandboxApi.define, sandboxApi.define, 'Sandbox public api has wrong value');
				equal(sandboxApi.sandboxManager.sandbox.sandboxApi.destroy, sandboxApi.destroy, 'Sandbox public api has wrong value');
				equal(sandboxApi.sandboxManager.sandbox.sandboxApi.parentWindow, window, 'Sandbox public api has wrong link to parent window object');
			});

			require(['sandbox'], function(sandbox) {
				test('Checking predefined modules', function() {
					equal(typeof(sandboxApi.sandboxManager.sandbox), 'object', 'Sandbox public api should be available');
					equal(typeof(sandbox), 'object', 'Sandbox public api should be available');
					equal(sandbox, sandboxApi.sandboxManager.sandbox, 'Sandbox public api should be available');
				});
			});
		}
	});

	test('Creating sandbox with specifying requireMain', function() {
		var sandboxApi,
			scripts;

		stop();
		requrejsSandbox.set('DebugDataAttributeTest', {
			debug: true,
			requireMain: 'app/main',
			sandboxLinks: {
				testCallback: function() {
					start();
					equal(scripts.length, 2, 'sandbox has different script tag count');
					equal(scripts[0].getAttribute('data-main'), sandboxApi.sandboxManager.options.requireMain, 'require.js script tag has different data-main attribute');
					equal(scripts[1].getAttribute('src'), sandboxApi.sandboxManager.options.requireMain + '.js', 'sandbox has different script tag count');
				}
			},
			success: function(require, define) {
				sandboxApi = this;
				scripts = sandboxApi.sandboxManager.sandbox.document.getElementsByTagName('script');
			}
		});
	});
});

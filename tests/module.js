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

		requrejsSandbox.set('AppTest', {
			debug: true,
			requireUrl: '../static/js/libs/require.min.js',
			requireConfig: {
				baseUrl: 'module'
			},
			callback: function(require) {
				var sandboxApi = this;

				test('resoving url to file by it\'s name', function() {
					var options = {
							baseUrl: 'app/static/js',
							paths: {
								'css': '../../styles/css',
								'backbone': '../libs/backbone',
								'jquery': '../libs/jquery/jquery.min'
							}
						};

					equal(typeof(sandboxApi.sandboxManager), 'object', 'Can not find link to sandbox manager');
					equal(typeof(sandboxApi.sandboxManager.nameToUrl), 'function', 'Can not find nameToUrl method in sandbox manager');
					equal(sandboxApi.sandboxManager.nameToUrl('main', options), 'app/static/js/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('view/main', options), 'app/static/js/view/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('styles/main', options), 'app/static/js/styles/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('css/main', options), 'app/styles/css/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('jquery', options), 'app/static/libs/jquery/jquery.min', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('backbone', options), 'app/static/libs/backbone', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('backbone/backbone.min', options), 'app/static/libs/backbone/backbone.min', 'Wrong url resoving');
				});

				require(['css!style1', 'css!style2', 'view'], function(style1, style2, AppView) {
					test('css loading test', function() {
						equal(typeof(style1), 'object', 'Returned module object is not object');
						notEqual(style1.cssLink, null, 'Link to style DOM element was not found');
						equal(style1.cssLink.getAttribute('href'), 'module/style1.css', 'Link tag has wrong href value');
						equal(window.getComputedStyle(document.body).position, 'relative', 'Loaded styles was not applied before callback');
						equal(window.getComputedStyle(document.body).zIndex, 1, 'Loaded styles was not applied before callback');
					});

					test('loading and executing code in sandbox', function() {
						var instance = new AppView;

						equal(typeof(AppView), 'function', 'Loaded app has not returned constructor');
						equal(typeof(instance), 'object', 'App has wrong instance');
						equal(instance.localVar, 'variable', 'App attr has wrong value');
						equal(instance.globalVar, null, 'App has attr when it should be global variable');
						equal(window.globalVar, null, 'App global variable scoped to main window object');
						equal(sandboxApi.sandboxManager.sandbox.globalVar, 'variable', 'App global variable has not scoped to sandbox window object');
					});
				});
			}
		});
	});
});

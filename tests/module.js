asyncTest('loading requirejs-sandbox module', 1, function() {
	start();
	requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
		var pathNameArr = location.pathname.split('/'),
			pathName;

		pathNameArr[pathNameArr.length - 1] = '';
		pathName = pathNameArr.join('/');

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
			equal(Object.keys(sandbox).length, 5, 'sandbox api has wrong methods count');
			equal(sandbox.name, 'Test', 'sandbox has wrong name');
			equal(typeof(sandbox.status), 'number', 'status property is not number');
			strictEqual(sandbox.status, -1, 'sandbox has wrong status');
			equal(sandbox.require, null, '"require" function is defined before loaded');
			equal(sandbox.define, null, '"define" function is defined before loaded');
			equal(typeof(sandbox.destroy), 'function', 'destroy method is undefined');

			var anotherSandbox = requrejsSandbox.set('Test', {});

			equal(typeof(anotherSandbox), 'object', 'anotherSandbox api has not been returned');
			equal(anotherSandbox, sandbox, 'requirejs-sandbox returned wrong sandbox instance');
		});

		var callbackTestSandbox = requrejsSandbox.set('CallbackTest', {
			requireUrl: '../static/js/libs/require.min.js',
			callback: function(require, define) {
				var self = this,
					args = arguments,
					context = callbackTestSandbox;

				test('testing created sandbox', function() {
					var sandbox;

					equal(self, context, 'callback has wrong context');
					equal(typeof(require), 'function', 'sandbox require.js "require" function is undefined');
					equal(typeof(define), 'function', 'sandbox require.js "define" function is undefined');
					equal(require, context.require, 'sandbox api "require" method is not equal to arguments "require" function');
					equal(define, context.define, 'sandbox api "define" method is not equal to arguments "define" function');
					equal(args.length, 2, 'sandbox callback function\'s arguments has wrong count');

					equal(self.name, 'CallbackTest', 'sandbox has wrong name');
					equal(typeof(self.status), 'number', 'status property is not number');
					strictEqual(self.status, 1, 'sandbox has wrong status');
					equal(typeof(self.require), 'function', '"require" method is not defined');
					equal(typeof(self.define), 'function', '"define" method is not defined');
					equal(typeof(self.destroy), 'function', 'destroy method is undefined');

					self.destroy();
					sandbox = requrejsSandbox.get(self.name);

					equal(typeof(sandbox), 'undefined', 'requirejs-sandbox returned deleted sandbox');
					equal(Object.keys(self).length, 0, 'sandbox api has wrong methods count');
					equal(Object.keys(context).length, 0, 'sandbox api has wrong methods count');
				});
			}
		});

		var wrongTestSandbox = requrejsSandbox.set('WrongTest', {
			callback: function(require, define) {
				var self = this;

				test('creating sandbox without specifying requireUrl', function() {
					var sandbox;

					equal(self, wrongTestSandbox, 'callback has wrong context');
					equal(typeof(require), 'undefined', 'require.js function "require" can\'t be created without specifying requireUrl');
					equal(typeof(define), 'undefined', 'require.js function "define" can\'t be created without specifying requireUrl');
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
				baseUrl: 'module',
				paths: {
					'configTest': 'submodule',
					'jquery': '../../static/js/libs/jquery/jquery.min'
				}
			},
			callback: function(require) {
				var sandboxApi = this;

				test('resoving url to file by it\'s name', function() {
					var options = {
							baseUrl: 'app/static/js',
							paths: {
								'css': '../../styles/css',
								'backbone': '../libs/backbone',
								'jquery': '../libs/jquery/jquery.min',
								'underscore': '../../../libs/underscore',
							}
						};

					equal(typeof(sandboxApi.sandboxManager), 'object', 'Can not find link to sandbox manager');
					equal(typeof(sandboxApi.sandboxManager.nameToUrl), 'function', 'Can not find nameToUrl method in sandbox manager');
					equal(sandboxApi.sandboxManager.nameToUrl('main', options), pathName + 'app/static/js/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('view/main', options), pathName + 'app/static/js/view/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('styles/main', options), pathName + 'app/static/js/styles/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('css/main', options), pathName + 'app/styles/css/main', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('jquery', options), pathName + 'app/static/libs/jquery/jquery.min', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('backbone', options), pathName + 'app/static/libs/backbone', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('backbone/backbone.min', options), pathName + 'app/static/libs/backbone/backbone.min', 'Wrong url resoving');
					equal(sandboxApi.sandboxManager.nameToUrl('underscore', options), pathName + 'libs/underscore', 'Wrong url resoving');
				});

				require(['css!style1', 'css!style2', 'view', 'configTest/view', 'jquery'], function(style1, style2, AppView, subView, $) {
					test('css loading test', function() {
						equal(typeof(style1), 'object', 'Returned module object is not object');
						notEqual(style1.cssLink, null, 'Link to style DOM element was not found');
						equal(style1.cssLink.getAttribute('href'), pathName + 'module/style1.css', 'Link tag has wrong href value');
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

					test('configuring sandbox require with requireConfig', function() {
						equal(typeof(subView), 'object', 'Returned module\'s object from sub folder is not object');
						equal(subView.var, 1, 'Returned module\'s object from sub folder has wrong content');
						equal(typeof($), 'function', 'Returned jQuery instance is not function');
					});
				});
			}
		});

		requrejsSandbox.set('TransitsTest', {
			requireUrl: '../static/js/libs/require.min.js',
			requireConfig: {
				baseUrl: 'module',
				paths: {
					'jquery': '../../static/js/libs/jquery/jquery.min'
				}
			},
			callback: function(require) {
				var qunitEl = document.getElementById('qunit');

				require(['jquery'], function($) {
					test('testing jQuery without transits', function() {
						equal(typeof($), 'function', 'Returned jQuery instance is not function');
						equal($('#qunit').length, 0, 'jQuery has wrong searching scope. There is no element with id "qunit" in sandbox');
					});
				});

				require(['transit!jquery'], function($) {
					test('testing jQuery with transits', function() {
						equal(typeof($), 'function', 'Returned jQuery instance is not function');
						equal($('#qunit').length, 1, 'jQuery has wrong searching scope. There is element with id "qunit" in main page');
						equal($('#qunit')[0], qunitEl, '"qunitEl" should be equal to jQuery result');
						equal($('#qunit').is(':visible'), true, 'jQuery transit has wrong "getComputedStyle" in sandbox. Element with id "qunit" is visible in main page');

						$('#qunit').addClass('transit-test');

						equal($('#qunit')[0].className, qunitEl.className, '"qunitEl" className should be equal to jQuery\'s result className');
						equal($('#qunit').hasClass('transit-test'), true, 'jQuery transit has wrong "getComputedStyle" in sandbox. Element with id "qunit" has className "transit-test" in main page');

						$('#qunit').removeClass('transit-test');

						equal($('#qunit').hasClass('transit-test'), false, 'jQuery transit has wrong "getComputedStyle" in sandbox. Element with id "qunit" has no className "transit-test" in main page');
						equal(typeof(window.$), 'undefined', 'There should be no jQuery methods in mainpage "window" object');
					});
				});
			}
		});

		requrejsSandbox.set('MootoolsTest', {
			debug: true,
			requireUrl: '../static/js/libs/require.min.js',
			requireConfig: {
				baseUrl: 'module',
				paths: {
					'jquery': '../../static/js/libs/jquery/jquery.min',
					'mootools': 'libs/mootools.min'
				},
				shim: {
					mootools: {
						exports: '$$'
					}
				}
			},
			callback: function(require) {
				require(['mootools', 'transit!jquery'], function(moo, $) {
					test('mootools tests', function() {
						equal(moo('#qunit').length, 0, 'Mootools has wrong searching scope. There is no element with id "qunit" in sandbox');
						equal(typeof(window.$$), 'undefined', 'There should be no mootols methods in mainpage "window" object');
					});
				});
			}
		});
	});
});

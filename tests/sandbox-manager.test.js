requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
	var pathNameArr = location.pathname.split('/'),
		pathName;

	pathNameArr[pathNameArr.length - 1] = '';
	pathName = pathNameArr.join('/');

	QUnit.start();

	test('Check requirejs-sandbox api', function() {
		equal(typeof(requrejsSandbox), 'object', 'requirejs-sandbox api is undefined');
		equal(Object.keys(requrejsSandbox).length, 3, 'requirejs-sandbox api has wrong methods count');
		equal(typeof(requrejsSandbox.get), 'function', 'get method is undefined');
		equal(typeof(requrejsSandbox.set), 'function', 'set method is undefined');
		equal(typeof(requrejsSandbox.destroy), 'function', 'destroy method is undefined');
	});

	test('Creating sandbox with name: Test', function() {
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
				strictEqual(sandboxApi.status, 1, 'sandbox has wrong status');
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

	requirejs(['requirejs-sandbox/plugins/css'], function(cssPlugin) {
		test('Resoving url to file by it\'s name', function() {
			var options = {
					baseUrl: 'app/static/js',
					paths: {
						'css': '../../styles/css',
						'backbone': '../libs/backbone',
						'jquery': '../libs/jquery/jquery.min',
						'underscore': '../../../libs/underscore',
					}
				};

			equal(typeof(cssPlugin), 'object', 'Css plugin was not loaded');
			equal(typeof(cssPlugin.nameToUrl), 'function', 'Can not find nameToUrl method in cssPlugin');
			equal(cssPlugin.nameToUrl('main', options), pathName + 'app/static/js/main', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('view/main', options), pathName + 'app/static/js/view/main', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('styles/main', options), pathName + 'app/static/js/styles/main', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('css/main', options), pathName + 'app/styles/css/main', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('jquery', options), pathName + 'app/static/libs/jquery/jquery.min', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('backbone', options), pathName + 'app/static/libs/backbone', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('backbone/backbone.min', options), pathName + 'app/static/libs/backbone/backbone.min', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('underscore', options), pathName + 'libs/underscore', 'Wrong url resoving');

			var options = {
					baseUrl: '/static/app/',
					paths: {
						'css': '../styles/css',
						'backbone': 'http://site.com/lib/backbone',
					}
				};

			equal(cssPlugin.nameToUrl('main', options), '/static/app/main', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('css/main', options), '/static/styles/css/main', 'Wrong url resoving');
			equal(cssPlugin.nameToUrl('backbone', options), 'http://site.com/lib/backbone', 'Wrong url resoving');
		});
	});

	var wrongTestSandbox = requrejsSandbox.set('WrongTest', {
		callback: function(require, define) {
			var sandboxApi = this;

			test('Creating sandbox without specifying requireUrl', function() {
				var sandbox;

				equal(sandboxApi, wrongTestSandbox, 'callback has wrong context');
				equal(typeof(require), 'undefined', 'require.js function "require" can\'t be created without specifying requireUrl');
				equal(typeof(define), 'undefined', 'require.js function "define" can\'t be created without specifying requireUrl');
				equal(typeof(sandboxApi), 'object', 'WrongTest can\'t be found');
				strictEqual(sandboxApi.status, 0, 'WrongTest has wrong status');

				requrejsSandbox.destroy('WrongTest');
				sandbox = requrejsSandbox.get(sandboxApi.name);

				equal(typeof(sandbox), 'undefined', 'requirejs-sandbox returned deleted sandbox');
				equal(Object.keys(sandboxApi).length, 0, 'sandbox api has wrong methods count');
				equal(Object.keys(wrongTestSandbox).length, 0, 'sandbox api has wrong methods count');
			});
		}
	});

	requrejsSandbox.set('DebugDataAttributeTest', {
		debug: true,
		requireMain: 'app/main',
		requireUrl: '../static/js/libs/require.min.js',
		callback: function(require, define) {
			var sandboxApi = this,
				scripts = sandboxApi.sandboxManager.sandbox.document.getElementsByTagName('script');

			test('Creating sandbox with specifying requireMain', function() {
				equal(scripts.length, 2, 'sandbox has different script tag count');
				equal(scripts[1].getAttribute('data-main'), sandboxApi.sandboxManager.options.requireMain, 'require.js script tag has different data-main attribute');
				stop();

				setTimeout(function() {
					equal(scripts.length, 3, 'sandbox has different script tag count');
					equal(scripts[2].getAttribute('src'), sandboxApi.sandboxManager.options.requireMain + '.js', 'sandbox has different script tag count');
					start();
				}, 1000);
			});
		}
	});
});

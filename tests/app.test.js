requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
	requrejsSandbox.set('AppTest', {
		debug: true,
		requireUrl: '../static/js/libs/require.min.js',
		requireConfig: {
			baseUrl: 'app',
			paths: {
				'configTest': 'submodule',
				'jquery': '../../static/js/libs/jquery/jquery.min'
			}
		},
		callback: function(require) {
			var sandboxApi = this;

			require(['css!style1', 'css!style2', 'view', 'configTest/view', 'jquery'], function(style1, style2, AppView, subView, $) {
				QUnit.start();

				test('Css loading test', function() {
					equal(typeof(style1), 'object', 'Returned module object is not object');
					notEqual(style1.cssLink, null, 'Link to style DOM element was not found');
					equal(style1.cssLink.getAttribute('href'), 'app/style1.css', 'Link tag has wrong href value');
					equal(window.getComputedStyle(document.body).position, 'relative', 'Loaded styles was not applied before callback');
					equal(window.getComputedStyle(document.body).zIndex, 1, 'Loaded styles was not applied before callback');
				});

				test('Loading and executing code in sandbox', function() {
					var instance = new AppView;

					equal(typeof(AppView), 'function', 'Loaded app has not returned constructor');
					equal(typeof(instance), 'object', 'App has wrong instance');
					equal(instance.localVar, 'variable', 'App attr has wrong value');
					equal(instance.globalVar, null, 'App has attr when it should be global variable');
					equal(window.globalVar, null, 'App global variable scoped to main window object');
					equal(sandboxApi.sandboxManager.sandbox.globalVar, 'variable', 'App global variable has not scoped to sandbox window object');
				});

				test('Configuring sandbox require with requireConfig', function() {
					equal(typeof(subView), 'object', 'Returned module\'s object from sub folder is not object');
					equal(subView.var, 1, 'Returned module\'s object from sub folder has wrong content');
					equal(typeof($), 'function', 'Returned jQuery instance is not function');
				});
			});
		}
	});
});

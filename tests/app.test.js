require(['requirejs-sandbox'], function(requirejsSandbox) {
	requirejsSandbox.set('AppTest', {
		debug: true,
		patch: ['jquery'],
		requireConfig: {
			baseUrl: 'app',
			paths: {
				'configTest': 'submodule',
				'jquery': '../../bower_components/jquery/jquery'
			}
		},
		success: function(require) {
			var sandboxApi = this;

			require(['view', 'configTest/view', 'jquery'], function(AppView, subView, $) {
				QUnit.start();

				test('Loading and executing code in sandbox', function() {
					var instance = new AppView();

					equal(typeof(AppView), 'function', 'Loaded app has not returned constructor');
					equal(typeof(instance), 'object', 'App has wrong instance');
					equal(instance.localVar, 'variable', 'App attr has wrong value');
					equal(instance.globalVar, null, 'App has attr when it should be global variable');
					equal(window.globalVar, null, 'App global variable scoped to main window object');
					equal(sandboxApi.sandboxManager.sandbox.globalVar, 'variable', 'App global variable has not scoped to sandbox window object');
				});

				test('Configuring sandbox require with requireConfig', function() {
					equal(typeof(subView), 'object', 'Returned module\'s object from sub folder is not object');
					equal(subView.someVar, 1, 'Returned module\'s object from sub folder has wrong content');
					equal(typeof($), 'function', 'Returned jQuery instance is not function');
				});
			});
		}
	});
});

requirejs.config({
	baseUrl: 'app'
});

requirejs(['css!style1'], function(style) {
	test('Css loading without test', function() {
		equal(typeof(style), 'object', 'Returned module object is not object');
		notEqual(style.cssLink, null, 'Link to style DOM element was not found');
		equal(style.cssLink.getAttribute('href'), 'app/style1.css', 'Link tag has wrong href value');
		equal(window.getComputedStyle(document.body).position, 'relative', 'Loaded styles was not applied before callback');
	});
});

requirejs(['requirejs-sandbox', 'requirejs-css'], function(requrejsSandbox, requirejsCss) {
	requrejsSandbox.set('AppTest', {
		debug: true,
		requireUrl: '../static/js/libs/require.min.js',
		plugins: [requirejsCss, {
			name: 'defined_plugin',
			handler: function() {
				return {
					load: function(name, req, onload) {
						onload({
							success: true
						});
					}
				};
			}
		}],
		requireConfig: {
			baseUrl: 'app'
		},
		callback: function(require) {
			var sandboxApi = this;

			require.onError = function(error) {
				if (error.requireType == 'scripterror') {
					test('Undefined plugin test', function() {
						equal(error.requireModules.length, 1, 'Returned module object is not object');
						equal(error.requireModules[0], 'custom_plugin', 'Returned module object is not object');
					});
				}
			};

			require(['css!style2'], function(style) {
				QUnit.start();

				test('Css loading test', function() {
					equal(typeof(style), 'object', 'Returned module object is not object');
					notEqual(style.cssLink, null, 'Link to style DOM element was not found');
					equal(style.cssLink.getAttribute('href'), 'app/style2.css', 'Link tag has wrong href value');
					equal(window.getComputedStyle(document.body).zIndex, 1, 'Loaded styles was not applied before callback');
				});
			});

			require(['defined_plugin!style1'], function(result) {
				test('Defined custom plugin test', function() {
					equal(typeof(result), 'object', 'Returned module object is not object');
					equal(result.success, true, 'Returned module object is not object');
				});
			});

			require(['custom_plugin!style1'], function() {});
		}
	});
});

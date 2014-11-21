require.config({
	baseUrl: 'app'
});

require(['css!style1'], function(style) {
	test('Css loading without test', function() {
		equal(typeof(style), 'object', 'Returned module object is not object');
		notEqual(style.cssNode, null, 'Link to style DOM element was not found');
		equal(style.cssNode.getAttribute('href'), 'app/style1.css', 'Link tag has wrong href value');
		equal(window.getComputedStyle(document.body).position, 'relative', 'Loaded styles was not applied before callback');
	});
});

require(['requirejs-sandbox', 'requirejs-css'], function(requirejsSandbox, requirejsCss) {
	requirejsSandbox.set('AppTest', {
		debug: true,
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
		success: function(require) {
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
					var styleNode;

					equal(typeof(style), 'object', 'Returned module object is not object');
					equal(Object.keys(style).length, 3, 'Returned module object has wrong properties count');
					equal(typeof(style.cssNode), 'object', 'Link to style DOM element is not object');
					ok(style.cssNode instanceof HTMLElement, 'Link to style DOM element is not DOM node');
					notEqual(style.cssNode.parentNode, null, 'Link node should be placed in DOM');
					equal(typeof(style.append), 'function', 'Returned module does not have "append" method');
					equal(typeof(style.remove), 'function', 'Returned module does not have "remove" method');
					equal(style.cssNode.getAttribute('href'), 'app/style2.css', 'Link tag has wrong href value');
					equal(window.getComputedStyle(document.body).zIndex, 1, 'Loaded styles was not applied before callback');

					styleNode = document.getElementById('test-style');

					equal(styleNode, null, 'There should be no elements with id "test-style"');

					style.cssNode.id = 'test-style';
					styleNode = document.getElementById('test-style');

					notEqual(styleNode, null, 'There should be style elements with id "test-style"');

					style.remove();
					styleNode = document.getElementById('test-style');

					equal(styleNode, null, 'There should be no elements with id "test-style" after executing "remove" method');
					equal(typeof(style.cssNode), 'object', 'Link to style DOM element is not object');
					ok(style.cssNode instanceof HTMLElement, 'Link to style DOM element is not DOM node');
					equal(style.cssNode.parentNode, null, 'Link node should not be placed in DOM after executing "remove" method');

					style.append();
					styleNode = document.getElementById('test-style');

					notEqual(styleNode, null, 'There should be elements with id "test-style" after executing "append" method');
					equal(typeof(style.cssNode), 'object', 'Link to style DOM element is not object');
					ok(style.cssNode instanceof HTMLElement, 'Link to style DOM element is not DOM node');
					notEqual(style.cssNode.parentNode, null, 'Link node should be placed in DOM after executing "append" method');

					style.append();
					styleNode = document.getElementById('test-style');

					notEqual(styleNode, null, 'There should be elements with id "test-style" after second execution of "append" method');
					equal(typeof(style.cssNode), 'object', 'Link to style DOM element is not object');
					ok(style.cssNode instanceof HTMLElement, 'Link to style DOM element is not DOM node');
					notEqual(style.cssNode.parentNode, null, 'Link node should be placed in DOM after second execution of "append" method');
				});
			});

			require(['css!style2.css'], function(style) {
				test('Css loading test with extension', function() {
					equal(typeof(style), 'object', 'Returned module object is not object');
					equal(style.cssNode.getAttribute('href'), 'app/style2.css', 'Link tag has wrong href value');
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

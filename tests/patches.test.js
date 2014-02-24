requirejs(['requirejs-sandbox', 'requirejs-sandbox/helpers/patch'], function(requrejsSandbox, patchAbstract) {
	requrejsSandbox.set('PatchTest1', {
		requireConfig: {
			baseUrl: 'app',
			paths: {
				'jquery': '../../bower_components/jquery/jquery'
			}
		},
		patch: ['jquery'],
		success: function(require) {
			var qunitEl = document.getElementById('qunit');

			require(['jquery'], function($) {
				QUnit.start();

				test('Testing patch constructor', function() {
					var patch,
						anotherPatch;

					equal(typeof(patchAbstract), 'object', 'Patch constructor is not defined');
					equal(Object.keys(patchAbstract).length, 1, 'Patch constructor has wrong methods count');
					equal(typeof(patchAbstract.init), 'function', 'Patch constructor method "init" has wrong type');

					patch = patchAbstract.init();

					equal(typeof(patch), 'object', 'Patch object has wrong type');
					equal(Object.keys(patch).length, 6, 'Patch object attributes has wrong count');
					equal(typeof(patch.name), 'string', 'Patch object "name" attribute has wrong type');
					equal(patch.name, 'default', 'Patch name has wrong default value');
					equal(typeof(patch.shimName), 'string', 'Patch object "shimName" attribute has wrong type');
					equal(patch.shimName, 'default', 'Patch shimName has wrong default value');
					equal(typeof(patch._options), 'object', 'Patch object "_options" attribute has wrong type');
					equal(Object.keys(patch._options).length, 0, 'Patch object "_options" has wrong default value');
					equal(typeof(patch.enable), 'function', 'Patch method "enable" has wrong type');
					equal(typeof(patch.disable), 'function', 'Patch method "disable" has wrong type');
					equal(typeof(patch.setOptions), 'function', 'Patch method "setOptions" has wrong type');

					anotherPatch = patch.setOptions({
						someValue: 123
					});

					equal(typeof(anotherPatch), 'object', 'Wrapped patch object has wrong type');
					notEqual(anotherPatch, patch, 'Wrapped patch and original patch should not be equal');
					equal(anotherPatch.__proto__, patch, 'Wrapped patch prototype should be equal to original patch object');
					equal(Object.keys(anotherPatch).length, 1, 'Wrapped patch object attributes has wrong count');
					equal(typeof(anotherPatch._options.someValue), 'number', 'Wrapped patch options should contains "someValue" attribute');
					equal(typeof(patch._options.someValue), 'undefined', 'Original patch options should not contains "someValue" attribute');
				});

				test('Testing jQuery with patch', function() {
					equal(typeof($), 'function', 'Returned jQuery instance is not function');
					equal($('#qunit').length, 1, 'jQuery has wrong searching scope. There is element with id "qunit" in main page');
					equal($('#qunit')[0], qunitEl, '"qunitEl" should be equal to jQuery result');
					equal($('#qunit').is(':visible'), true, 'jQuery patch has wrong "getComputedStyle" in sandbox. Element with id "qunit" is visible in main page');

					$('#qunit').addClass('patch-test');

					equal($('#qunit')[0].className, qunitEl.className, '"qunitEl" className should be equal to jQuery\'s result className');
					equal($('#qunit').hasClass('patch-test'), true, 'jQuery patch has wrong "getComputedStyle" in sandbox. Element with id "qunit" has className "patch-test" in main page');

					$('#qunit').removeClass('patch-test');

					equal($('#qunit').hasClass('patch-test'), false, 'jQuery patch has wrong "getComputedStyle" in sandbox. Element with id "qunit" has no className "patch-test" in main page');
					equal(typeof(window.$), 'undefined', 'There should be no jQuery methods in mainpage "window" object');

					stop();

					requirejs(['requirejs-sandbox/patches/jquery'], function(jqueryPatch) {
						requrejsSandbox.set('PatchTest2', {
							requireConfig: {
								baseUrl: 'app',
								paths: {
									'jquery': '../../bower_components/jquery/jquery'
								}
							},
							patch: [jqueryPatch],
							success: function(require) {
								var qunitEl = document.getElementById('qunit');

								require(['jquery'], function($) {
									start();
									equal(typeof($), 'function', 'Returned jQuery instance is not function');
									equal($('#qunit').length, 1, 'jQuery has wrong searching scope. There is element with id "qunit" in main page');
									equal($('#qunit')[0], qunitEl, '"qunitEl" should be equal to jQuery result');
									equal($('#qunit').is(':visible'), true, 'jQuery patch has wrong "getComputedStyle" in sandbox. Element with id "qunit" is visible in main page');
								});
							}
						});
					});
				});
			});
		}
	});
});

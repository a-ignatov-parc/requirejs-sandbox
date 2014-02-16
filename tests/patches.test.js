requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
	requrejsSandbox.set('PatchTest1', {
		requireConfig: {
			baseUrl: 'app',
			paths: {
				'jquery': '../../static/js/libs/jquery/jquery.min'
			}
		},
		patch: ['jquery'],
		success: function(require) {
			var qunitEl = document.getElementById('qunit');

			require(['jquery'], function($) {
				QUnit.start();

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
						start();

						equal(typeof(jqueryPatch), 'object', 'Patch object has wrong type');
						equal(Object.keys(jqueryPatch).length, 4, 'Patch object attributes has wrong count');
						equal(typeof(jqueryPatch.name), 'string', 'Patch object "name" attribute has wrong type');
						equal(typeof(jqueryPatch.shimName), 'string', 'Patch object "shimName" attribute has wrong type');
						equal(typeof(jqueryPatch.enable), 'function', 'Patch method "enable" has wrong type');
						equal(typeof(jqueryPatch.disable), 'function', 'Patch method "disable" has wrong type');

						stop();

						requrejsSandbox.set('PatchTest2', {
							requireConfig: {
								baseUrl: 'app',
								paths: {
									'jquery': '../../static/js/libs/jquery/jquery.min'
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

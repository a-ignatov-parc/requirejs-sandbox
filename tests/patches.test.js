requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
	requrejsSandbox.set('TransitsTest', {
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

				test('Testing jQuery with transits', function() {
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
});

requirejs([
	'requirejs-sandbox',
	'requirejs-sandbox/helpers/resolvers/iframeResolver'
], function(requrejsSandbox, iframeResolver) {
	QUnit.start();

	test('Iframe resolver initial state and resolving', function() {
		var targetUrl = '../bower_components/requirejs/require.js',
			resolvedUrl;

		equal(typeof(iframeResolver), 'object', 'iframe resolver is undefined');
		equal(typeof(iframeResolver.id), 'string', 'id attribute is not undefined or has wrong type');
		equal(iframeResolver.id, 'iframe', 'iframe resolver has wrong id');
		equal(typeof(iframeResolver.resolve), 'function', 'resolve is undefined');
		equal(typeof(iframeResolver.reset), 'function', 'reset is undefined');
		equal(typeof(iframeResolver.state), 'function', 'state is undefined');
		equal(typeof(iframeResolver._state), 'string', 'internal attribute has wrong type');
		equal(iframeResolver._state, iframeResolver.STATE_IDLE, 'internal attribute has wrong initial value');
		equal(typeof(iframeResolver.state()), 'string', 'public method returned value has wrong type');
		equal(iframeResolver.state(), iframeResolver.STATE_IDLE, 'public method returned value has wrong initial value');
		equal(typeof(iframeResolver._resolvedUrl), 'boolean', 'internal attribute has wrong type');
		equal(iframeResolver._resolvedUrl, false, 'internal attribute has wrong initial value');

		resolvedUrl = iframeResolver.resolve(function(resolvedUrl) {
			start();
			equal(iframeResolver.state(), iframeResolver.STATE_RESOLVED, 'internal resolved value is not equal to initial value');
			equal(iframeResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');
			equal(resolvedUrl, targetUrl, 'returned value has incorrect value');

			resolvedUrl = iframeResolver.resolve();

			equal(iframeResolver.state(), iframeResolver.STATE_RESOLVED, 'resolver has wrong state');
			equal(iframeResolver._resolvedUrl, targetUrl, 'resolved value is not equal to initial value');
			equal(resolvedUrl, targetUrl, 'returned value has incorrect value');

			iframeResolver.reset();

			equal(iframeResolver.state(), iframeResolver.STATE_IDLE, 'resolver has wrong state');
			equal(iframeResolver._resolvedUrl, targetUrl, 'resolved value is not equal to initial value');

			resolvedUrl = iframeResolver.resolve(function(resolvedUrl) {
				start();
				equal(iframeResolver.state(), iframeResolver.STATE_RESOLVED, 'internal resolved value is not equal to initial value');
				equal(iframeResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');
				equal(resolvedUrl, targetUrl, 'returned value has incorrect value');
			});

			equal(iframeResolver.state(), iframeResolver.STATE_RESOLVING, 'internal resolved value is not equal to initial value');
			equal(iframeResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');
			equal(resolvedUrl, void(0), 'returned value has incorrect value');
			stop();
		});

		equal(iframeResolver.state(), iframeResolver.STATE_RESOLVING, 'internal resolved value is not equal to initial value');
		equal(iframeResolver._resolvedUrl, false, 'internal resolved value is not equal to initial value');
		equal(resolvedUrl, void(0), 'returned value has incorrect value');
		stop();
	});
});

requirejs([
	'helpers/resolvers/cdnResolver'
], function(cdnResolver) {
	QUnit.start();

	test('Options resolver initial state and resolving', function() {
		var targetUrl = '//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.9/require.min.js',
			resolvedUrl;

		equal(typeof(cdnResolver), 'object', 'cdn resolver is undefined');
		equal(typeof(cdnResolver.id), 'string', 'id attribute is not undefined or has wrong type');
		equal(cdnResolver.id, 'cdn', 'cdn resolver has wrong id');
		equal(typeof(cdnResolver.resolve), 'function', 'resolve is undefined');
		equal(typeof(cdnResolver.reset), 'function', 'reset is undefined');
		equal(typeof(cdnResolver.state), 'function', 'state is undefined');
		equal(typeof(cdnResolver._state), 'string', 'internal attribute has wrong type');
		equal(cdnResolver._state, cdnResolver.STATE_IDLE, 'internal attribute has wrong initial value');
		equal(typeof(cdnResolver.state()), 'string', 'public method returned value has wrong type');
		equal(cdnResolver.state(), cdnResolver.STATE_IDLE, 'public method returned value has wrong initial value');
		equal(typeof(cdnResolver._resolvedUrl), 'string', 'internal attribute has wrong type');
		equal(cdnResolver._resolvedUrl, targetUrl, 'internal attribute has wrong initial value');

		resolvedUrl = cdnResolver.resolve();

		equal(cdnResolver.state(), cdnResolver.STATE_RESOLVED, 'internal resolved value is not equal to initial value');
		equal(cdnResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');
		equal(resolvedUrl, targetUrl, 'returned value has incorrect value');

		resolvedUrl = cdnResolver.resolve();

		equal(cdnResolver.state(), cdnResolver.STATE_RESOLVED, 'internal resolved value is not equal to initial value');
		equal(cdnResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');
		equal(resolvedUrl, targetUrl, 'returned value has incorrect value');

		cdnResolver.reset();

		equal(cdnResolver.state(), cdnResolver.STATE_IDLE, 'resolver has wrong state');
		equal(cdnResolver._resolvedUrl, targetUrl, 'resolved value is not equal to initial value');

		resolvedUrl = cdnResolver.resolve();

		equal(cdnResolver.state(), cdnResolver.STATE_RESOLVED, 'internal resolved value is not equal to initial value');
		equal(cdnResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');
		equal(resolvedUrl, targetUrl, 'returned value has incorrect value');
	});
});

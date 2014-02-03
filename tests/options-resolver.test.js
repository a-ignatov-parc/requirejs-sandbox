requirejs([
	'requirejs-sandbox',
	'requirejs-sandbox/helpers/resolvers/optionsResolver'
], function(requrejsSandbox, optionsResolver) {
	QUnit.start();

	test('Options resolver initial state and resolving', function() {
		var targetUrl = 'url-to-libs/require.js',
			anotherUrl = 'another-url-to/require.js',
			resolvedUrl;

		console.log(optionsResolver);

		equal(typeof(optionsResolver), 'object', 'options resolver is undefined');
		equal(typeof(optionsResolver.id), 'string', 'id attribute is not undefined or has wrong type');
		equal(optionsResolver.id, 'options', 'options resolver has wrong id');
		equal(typeof(optionsResolver.resolve), 'function', 'resolve is undefined');
		equal(typeof(optionsResolver.reset), 'function', 'reset is undefined');
		equal(typeof(optionsResolver.state), 'function', 'state is undefined');
		equal(typeof(optionsResolver._state), 'string', 'internal attribute has wrong type');
		equal(optionsResolver._state, optionsResolver.STATE_IDLE, 'internal attribute has wrong initial value');
		equal(typeof(optionsResolver.state()), 'string', 'public method returned value has wrong type');
		equal(optionsResolver.state(), optionsResolver.STATE_IDLE, 'public method returned value has wrong initial value');
		equal(typeof(optionsResolver._resolvedUrl), 'boolean', 'internal attribute has wrong type');
		equal(optionsResolver._resolvedUrl, false, 'internal attribute has wrong initial value');

		resolvedUrl = optionsResolver.resolve();

		equal(optionsResolver.state(), optionsResolver.STATE_IDLE, 'internal resolved value is not equal to initial value');
		equal(optionsResolver._resolvedUrl, false, 'internal resolved value is not equal to initial value');

		resolvedUrl = optionsResolver.resolve(null, null, {
			hello: 'world'
		});

		equal(optionsResolver.state(), optionsResolver.STATE_IDLE, 'internal resolved value is not equal to initial value');
		equal(optionsResolver._resolvedUrl, false, 'internal resolved value is not equal to initial value');

		resolvedUrl = optionsResolver.resolve(null, null, {
			requireUrl: targetUrl
		});

		equal(optionsResolver.state(), optionsResolver.STATE_RESOLVED, 'public method returned value has wrong state');
		equal(optionsResolver._resolvedUrl, resolvedUrl, 'internal resolved value is not equal to returned value');
		equal(resolvedUrl, targetUrl, 'returned value is not equal to initial value');
		equal(optionsResolver._resolvedUrl, targetUrl, 'internal resolved value is not equal to initial value');

		resolvedUrl = optionsResolver.resolve(null, null, {
			requireUrl: anotherUrl
		});

		equal(optionsResolver.state(), optionsResolver.STATE_RESOLVED, 'resolver has wrong state');
		notEqual(optionsResolver._resolvedUrl, anotherUrl, 'resolved value is equal to wrong value');
		equal(optionsResolver._resolvedUrl, targetUrl, 'resolved value is not equal to initial value');

		resolvedUrl = optionsResolver.resolve();

		equal(optionsResolver.state(), optionsResolver.STATE_RESOLVED, 'resolver has wrong state');
		equal(optionsResolver._resolvedUrl, targetUrl, 'resolved value is not equal to initial value');

		optionsResolver.reset();

		equal(optionsResolver.state(), optionsResolver.STATE_IDLE, 'resolver has wrong state');
		equal(optionsResolver._resolvedUrl, targetUrl, 'resolved value is not equal to initial value');

		resolvedUrl = optionsResolver.resolve(null, null, {
			requireUrl: anotherUrl
		});

		equal(optionsResolver.state(), optionsResolver.STATE_RESOLVED, 'resolver has wrong state');
		notEqual(optionsResolver._resolvedUrl, targetUrl, 'resolved value is equal to wrong value');
		equal(optionsResolver._resolvedUrl, anotherUrl, 'resolved value is not equal to new value');
		equal(resolvedUrl, anotherUrl, 'returned value is not equal to new value');
	});
});

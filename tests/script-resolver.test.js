requirejs([
	'requirejs-sandbox/helpers/utils',
	'requirejs-sandbox/helpers/resolvers/scriptResolver'
], function(utils, scriptResolver) {
	QUnit.start();

	test('Script resolver initial state and resolving', function() {
		var urlList = [{
				url: 'scripts/require.min.js',
				result: true
			},{
				url: 'scripts/require.js',
				result: true
			},{
				url: '//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.9/require.min.js',
				result: true
			},{
				url: 'scripts/require-min.js',
				result: true
			}],
			resolvedUrl;

		equal(typeof(scriptResolver), 'object', 'script resolver is undefined');
		equal(typeof(scriptResolver.id), 'string', 'id attribute is not undefined or has wrong type');
		equal(scriptResolver.id, 'script', 'script resolver has wrong id');
		equal(typeof(scriptResolver.resolve), 'function', 'resolve is undefined');
		equal(typeof(scriptResolver.reset), 'function', 'reset is undefined');
		equal(typeof(scriptResolver.state), 'function', 'state is undefined');
		equal(typeof(scriptResolver._checkUrl), 'function', 'privat method _checkUrl is undefined');
		equal(typeof(scriptResolver._getScripts), 'function', 'privat method _getScripts is undefined');
		equal(typeof(scriptResolver._state), 'string', 'internal attribute has wrong type');
		equal(scriptResolver._state, scriptResolver.STATE_IDLE, 'internal attribute has wrong initial value');
		equal(typeof(scriptResolver.state()), 'string', 'public method returned value has wrong type');
		equal(scriptResolver.state(), scriptResolver.STATE_IDLE, 'public method returned value has wrong initial value');
		equal(typeof(scriptResolver._resolvedUrl), 'boolean', 'internal attribute has wrong type');
		equal(scriptResolver._resolvedUrl, false, 'internal attribute has wrong initial value');

		utils.each(urlList, function(item) {
			equal(scriptResolver._checkUrl(item.url), item.result, 'url was checked incorrectly for: "' + item.url + '"');
		});

		resolvedUrl = scriptResolver.resolve();

		equal(scriptResolver.state(), scriptResolver.STATE_RESOLVED, 'public method returned value has wrong state');
		equal(scriptResolver._resolvedUrl, resolvedUrl, 'internal resolved value is not equal to returned value');

		scriptResolver.resolve(null, null, {
			hello: 'world'
		});

		equal(scriptResolver.state(), scriptResolver.STATE_RESOLVED, 'public method returned value has wrong state');
		equal(scriptResolver._resolvedUrl, resolvedUrl, 'internal resolved value is not equal to returned value');
	});
});

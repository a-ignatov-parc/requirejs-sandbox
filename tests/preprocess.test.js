requirejs(['requirejs-sandbox'], function(requrejsSandbox) {
	requrejsSandbox.set('AppTest', {
		requireConfig: {
			baseUrl: 'app'
		},
		success: function(require) {
			var sandboxApi = this;

			require(['preprocess!main'], function(mainProcessor) {
				QUnit.start();

				test('Resource preprocessing test', function() {
					equal(typeof(mainProcessor), 'object', 'Returned processor object is not object');
					equal(Object.keys(mainProcessor).length, 2, 'Processor properties has wrong count');

					equal(typeof(mainProcessor.id), 'number', 'Processor "id" is not a number');
					equal(typeof(mainProcessor.status), 'number', 'Processor "status" is not a number');
					equal(mainProcessor.status, 0, 'Processor "status" is not "success"');

					ok(typeof(mainProcessor._responseSourceCache) === 'object' && 'length' in mainProcessor._responseSourceCache, 'Processor private property "_responseSourceCache" in not array');
					equal(mainProcessor._responseSourceCache.length > 0, true, 'Processor\'s source cache is empty.');
					equal(typeof(mainProcessor._responseSourceCache[mainProcessor.id]), 'string', 'Processor source code must be string');

					equal(typeof(mainProcessor.autoWrap), 'function', 'JS Processor must have "autoWrap" method');
					equal(typeof(mainProcessor.replace), 'function', 'JS Processor must have "replace" method');
					equal(typeof(mainProcessor.resolve), 'function', 'JS Processor must have "resolve" method');
				});
			});
		}
	});
});

requirejs([
	'requirejs-sandbox',
	'requirejs-css',
	'requirejs-preprocess-css'
], function(requrejsSandbox, requirejsCss, requirejsPreprocessCss) {
	requrejsSandbox.set('AppTest', {
		requireConfig: {
			baseUrl: 'app'
		},
		plugins: [requirejsCss, requirejsPreprocessCss],
		success: function(require) {
			var sandboxApi = this;

			require(['sandbox', 'preprocess!preprocess/main', 'preprocess-css!preprocess/style'], function(sandbox, mainProcessor, styleProcessor) {
				QUnit.start();

				test('Resource preprocessing test', function() {
					// JS Preprocessor part.
					var jsSourceCode,
						clearVariables = function() {
							delete window.testResultNoWindow;
							delete window.testResultWithWindow;
							delete sandbox.testResultNoWindow;
							delete sandbox.testResultWithWindow;
							delete sandbox.sandboxApi.windowProxy.testResultNoWindow;
							delete sandbox.sandboxApi.windowProxy.testResultWithWindow;
							mainProcessor._responseSourceCache[mainProcessor.id] = jsSourceCode;
						};

					equal(typeof(mainProcessor), 'object', 'Returned processor object is not object');
					equal(Object.keys(mainProcessor).length, 2, 'Processor properties has wrong count');

					equal(typeof(mainProcessor.id), 'number', 'Processor "id" is not a number');
					equal(typeof(mainProcessor.status), 'number', 'Processor "status" is not a number');
					equal(mainProcessor.status, 0, 'Processor "status" is not "success"');

					ok(typeof(mainProcessor._responseSourceCache) === 'object' && 'length' in mainProcessor._responseSourceCache, 'Processor private property "_responseSourceCache" in not array');
					equal(mainProcessor._responseSourceCache.length > 0, true, 'Processor\'s source cache is empty.');
					equal(typeof(mainProcessor._responseSourceCache[mainProcessor.id]), 'string', 'Processor source code must be string');

					jsSourceCode = mainProcessor._responseSourceCache[mainProcessor.id];

					equal(typeof(mainProcessor.autoWrap), 'function', 'JS Processor must have "autoWrap" method');
					equal(typeof(mainProcessor.replace), 'function', 'JS Processor must have "replace" method');
					equal(typeof(mainProcessor.resolve), 'function', 'JS Processor must have "resolve" method');

					equal(window.testResultNoWindow, null, 'Before resolving processor varialble "testResultNoWindow" should be undefined in parent window object');
					equal(window.testResultWithWindow, null, 'Before resolving processor varialble "testResultWithWindow" should be undefined in parent window object');
					equal(sandbox.testResultNoWindow, null, 'Before resolving processor varialble "testResultNoWindow" should be undefined in sandbox window object');
					equal(sandbox.testResultWithWindow, null, 'Before resolving processor varialble "testResultWithWindow" should be undefined in sandbox window object');
					equal(sandbox.sandboxApi.windowProxy.testResultNoWindow, null, 'Before resolving processor varialble "testResultNoWindow" should be undefined in sandbox windowProxy object');
					equal(sandbox.sandboxApi.windowProxy.testResultWithWindow, null, 'Before resolving processor varialble "testResultWithWindow" should be undefined in sandbox windowProxy object');

					mainProcessor.resolve(function(result) {
						equal(result, null, 'Resolving result for test script should be undefined');
					});

					equal(window.testResultNoWindow, null, 'Varialble "testResultNoWindow" from test script should not be passed to parent window object');
					equal(window.testResultWithWindow, null, 'Varialble "testResultWithWindow" from test script should not be passed to parent window object');
					equal(sandbox.testResultNoWindow, sandbox.location.href, 'Varialble "testResultNoWindow" should be equal to sandbox location value');
					equal(sandbox.testResultWithWindow, sandbox.location.href, 'Varialble "testResultWithWindow" should be equal to sandbox location value');
					equal(sandbox.sandboxApi.windowProxy.testResultNoWindow, sandbox.location.href, 'Varialble "testResultNoWindow" in windowProxy should be equal to sandbox location value');
					equal(sandbox.sandboxApi.windowProxy.testResultWithWindow, sandbox.location.href, 'Varialble "testResultWithWindow" in windowProxy should be equal to sandbox location value');

					// Обнуляем прошлый результат и исходный код тестового скрипты в процессоре.
					clearVariables();

					mainProcessor.autoWrap();
					mainProcessor.resolve(function(result) {
						equal(result, null, 'Resolving result after auto wrapping for test script should be undefined');
					});

					equal(window.testResultNoWindow, null, 'After auto wrapping test script varialble "testResultNoWindow" should be undefined in parent window object');
					equal(window.testResultWithWindow, null, 'After auto wrapping test script varialble "testResultWithWindow" should be undefined in parent window object');
					equal(sandbox.testResultNoWindow, window.location.href, 'After auto wrapping test script varialble "testResultNoWindow" in sandbox should be equal to parent window location value');
					equal(sandbox.testResultWithWindow, null, 'After auto wrapping test script varialble "testResultWithWindow" should be undefined in sandbox window object');
					equal(sandbox.sandboxApi.windowProxy.testResultNoWindow, window.location.href, 'After auto wrapping test script varialble "testResultNoWindow" in windowProxy should be equal to parent window location value');
					equal(sandbox.sandboxApi.windowProxy.testResultWithWindow, window.location.href, 'After auto wrapping test script varialble "testResultWithWindow" in windowProxy should be synced with sandbox window object and equal to parent window location value');

					// Обнуляем прошлый результат и исходный код тестового скрипты в процессоре.
					clearVariables();

					mainProcessor.replace(/$/, 'return true;');
					mainProcessor.resolve(function(result) {
						equal(result, true, 'Resolving result after replacing for test script should be equal "true"');
					});

					// CSS Preprocessor part.
					equal(typeof(styleProcessor), 'object', 'Returned processor object is not object');
					equal(Object.keys(styleProcessor).length, 2, 'Processor properties has wrong count');

					equal(typeof(styleProcessor.id), 'number', 'Processor "id" is not a number');
					equal(typeof(styleProcessor.status), 'number', 'Processor "status" is not a number');
					equal(styleProcessor.status, 0, 'Processor "status" is not "success"');

					ok(typeof(styleProcessor._responseSourceCache) === 'object' && 'length' in styleProcessor._responseSourceCache, 'Processor private property "_responseSourceCache" in not array');
					equal(styleProcessor._responseSourceCache.length > 0, true, 'Processor\'s source cache is empty.');
					equal(typeof(styleProcessor._responseSourceCache[styleProcessor.id]), 'string', 'Processor source code must be string');

					equal(typeof(styleProcessor.prefix), 'function', 'CSS Processor must have "prefix" method');
					equal(typeof(styleProcessor.replace), 'function', 'CSS Processor must have "replace" method');
					equal(typeof(styleProcessor.resolve), 'function', 'CSS Processor must have "resolve" method');
				});
			});
		}
	});
});

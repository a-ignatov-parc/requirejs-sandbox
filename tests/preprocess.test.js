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

			require([
				'sandbox',
				'preprocess!preprocess/main',
				'preprocess!preprocess/module-noname-nodeps',
				'preprocess!preprocess/module-noname-deps',
				'preprocess!preprocess/module-name-nodeps',
				'preprocess!preprocess/module-name-deps',
				'preprocess-css!preprocess/style'
			], function(sandbox, mainProcessor, amdNoNameNoDepProcessor, amdNoNameDepProcessor, amdNameNoDepProcessor, amdNameDepProcessor, styleProcessor) {
				QUnit.start();

				test('Resource preprocessing test', function() {
					// Simple JS Preprocessor part.
					var jsSourceCode,
						cssSourceCode,
						clearVariables = function() {
							delete window.testResultNoWindow;
							delete window.testResultWithWindow;
							delete sandbox.testResultNoWindow;
							delete sandbox.testResultWithWindow;
							mainProcessor._responseSourceCache[mainProcessor.id] = jsSourceCode;
						},
						setCssSourceCode = function(sourceCode) {
							return styleProcessor._responseSourceCache[styleProcessor.id] = sourceCode;
						},
						getCssSourceCode = function() {
							return styleProcessor._responseSourceCache[styleProcessor.id];
						},
						testQueue = [],
						testStylesString = '{ position: relative; }',
						amdNameNoDepResult,
						amdNameDepResult;

					equal(typeof(mainProcessor), 'object', 'Returned processor object is not object');
					equal(Object.keys(mainProcessor).length, 3, 'Processor properties has wrong count');

					equal(typeof(mainProcessor.id), 'number', 'Processor "id" is not a number');
					equal(typeof(mainProcessor.status), 'number', 'Processor "status" is not a number');
					equal(typeof(mainProcessor.target), 'object', 'Processor "target" should be link to "window" object');
					equal(mainProcessor.status, 0, 'Processor "status" is not "success"');

					ok(typeof(mainProcessor._responseSourceCache) === 'object' && 'length' in mainProcessor._responseSourceCache, 'Processor private property "_responseSourceCache" in not array');
					equal(mainProcessor._responseSourceCache.length > 0, true, 'Processor\'s source cache is empty.');
					equal(typeof(mainProcessor._responseSourceCache[mainProcessor.id]), 'string', 'Processor source code must be string');

					jsSourceCode = mainProcessor._responseSourceCache[mainProcessor.id];

					equal(typeof(mainProcessor.autoFix), 'function', 'JS Processor must have "autoFix" method');
					equal(typeof(mainProcessor.replace), 'function', 'JS Processor must have "replace" method');
					equal(typeof(mainProcessor.resolve), 'function', 'JS Processor must have "resolve" method');

					equal(window.testResultNoWindow, null, 'Before resolving processor varialble "testResultNoWindow" should be undefined in parent window object');
					equal(window.testResultWithWindow, null, 'Before resolving processor varialble "testResultWithWindow" should be undefined in parent window object');
					equal(sandbox.testResultNoWindow, null, 'Before resolving processor varialble "testResultNoWindow" should be undefined in sandbox window object');
					equal(sandbox.testResultWithWindow, null, 'Before resolving processor varialble "testResultWithWindow" should be undefined in sandbox window object');

					mainProcessor.resolve(function(result) {
						equal(result, null, 'Resolving result for test script should be undefined');
					});

					equal(window.testResultNoWindow, null, 'Varialble "testResultNoWindow" from test script should not be passed to parent window object');
					equal(window.testResultWithWindow, null, 'Varialble "testResultWithWindow" from test script should not be passed to parent window object');
					equal(sandbox.testResultNoWindow, sandbox.location.href, 'Varialble "testResultNoWindow" should be equal to sandbox location value');
					equal(sandbox.testResultWithWindow, sandbox.location.href, 'Varialble "testResultWithWindow" should be equal to sandbox location value');

					// Обнуляем прошлый результат и исходный код тестового скрипты в процессоре.
					clearVariables();

					mainProcessor.autoFix();
					mainProcessor.resolve(function(result) {
						equal(result, null, 'Resolving result after auto fixing for test script should be undefined');
					});

					equal(window.testResultNoWindow, null, 'After auto fixing test script varialble "testResultNoWindow" should be undefined in parent window object');
					equal(window.testResultWithWindow, null, 'After auto fixing test script varialble "testResultWithWindow" should be undefined in parent window object');
					equal(sandbox.testResultNoWindow, window.location.href, 'After auto fixing test script varialble "testResultNoWindow" in sandbox should be equal to parent window location value');
					equal(sandbox.testResultWithWindow, window.location.href, 'After auto fixing test script varialble "testResultWithWindow" in sandbox should be equal to parent window location value');

					// Обнуляем прошлый результат и исходный код тестового скрипты в процессоре.
					clearVariables();

					// CSS Preprocessor part.
					equal(typeof(styleProcessor), 'object', 'Returned processor object is not object');
					equal(Object.keys(styleProcessor).length, 3, 'Processor properties has wrong count');

					equal(typeof(styleProcessor.id), 'number', 'Processor "id" is not a number');
					equal(typeof(styleProcessor.status), 'number', 'Processor "status" is not a number');
					equal(typeof(mainProcessor.target), 'object', 'Processor "target" should be link to "window" object');
					equal(styleProcessor.status, 0, 'Processor "status" is not "success"');

					ok(typeof(styleProcessor._responseSourceCache) === 'object' && 'length' in styleProcessor._responseSourceCache, 'Processor private property "_responseSourceCache" in not array');
					equal(styleProcessor._responseSourceCache.length > 0, true, 'Processor\'s source cache is empty.');
					equal(typeof(styleProcessor._responseSourceCache[styleProcessor.id]), 'string', 'Processor source code must be string');

					cssSourceCode = styleProcessor._responseSourceCache[styleProcessor.id];

					equal(typeof(styleProcessor.prefix), 'function', 'CSS Processor must have "prefix" method');
					equal(typeof(styleProcessor.replace), 'function', 'CSS Processor must have "replace" method');
					equal(typeof(styleProcessor.resolve), 'function', 'CSS Processor must have "resolve" method');

					equal(getCssSourceCode(), 'body { position: relative; }', 'Source code has wrong value');

					styleProcessor.replace('body', 'html');

					equal(getCssSourceCode(), 'html { position: relative; }', 'Source code has wrong value');

					styleProcessor.prefix('.container');

					equal(getCssSourceCode(), '.container { position: relative; }', 'Source code has wrong value');

					testQueue.push({
						source: 'html, body {styles}',
						result: '.container, .container {styles}'
					}, {
						source: ' .test {styles}',
						result: ' .container .test {styles}'
					}, {
						source: 'h1, article, #id-name,.button, [href] {styles}',
						result: '.container h1, .container article, .container #id-name,.container .button, .container [href] {styles}'
					}, {
						source: '@import url(https://fonts.googleapis.com/css?family=Electrolize);',
						result: '@import url(https://fonts.googleapis.com/css?family=Electrolize);'
					}, {
						source: '@import url(https://fonts.googleapis.com/css?family=Exo:400,500,600,700);',
						result: '@import url(https://fonts.googleapis.com/css?family=Exo:400,500,600,700);'
					}, {
						source: 'svg:not(:root) {styles}',
						result: '.container svg:not(:root) {styles}'
					}, {
						source: '::-moz-selection {styles}::selection{styles}',
						result: '.container ::-moz-selection {styles}.container ::selection{styles}'
					}, {
						source: 'button,input[type="button"],input[type="reset"],input[type="submit"]{styles}',
						result: '.container button,.container input[type="button"],.container input[type="reset"],.container input[type="submit"]{styles}'
					}, {
						source: 'button::-moz-focus-inner, input::-moz-focus-inner{styles}',
						result: '.container button::-moz-focus-inner, .container input::-moz-focus-inner{styles}'
					}, {
						source: 'header .external .auth a {styles}',
						result: '.container header .external .auth a {styles}'
					}, {
						source: 'div.className {styles} td#some-id {styles}',
						result: '.container div.className {styles} .container td#some-id {styles}'
					}, {
						source: '@font-face{font-family:\'Planetside2\';src:url(\'/styles/fonts/planetside2-webfont.eot\');src:url(\'/styles/fonts/planetside2-webfont.eot&#iefix\')format(\'embedded-opentype\'),url(\'/styles/fonts/planetside2-webfont.woff\')format(\'woff\'),url(\'/styles/fonts/planetside2-webfont.ttf\')format(\'truetype\'),url(\'/styles/fonts/planetside2-webfont.svg#webfont\')format(\'svg\');}',
						result: '@font-face{font-family:\'Planetside2\';src:url(\'/styles/fonts/planetside2-webfont.eot\');src:url(\'/styles/fonts/planetside2-webfont.eot&#iefix\')format(\'embedded-opentype\'),url(\'/styles/fonts/planetside2-webfont.woff\')format(\'woff\'),url(\'/styles/fonts/planetside2-webfont.ttf\')format(\'truetype\'),url(\'/styles/fonts/planetside2-webfont.svg#webfont\')format(\'svg\');}'
					}, {
						source: 'header .auth #loginLink:hover #bgHighlight{styles}',
						result: '.container header .auth #loginLink:hover #bgHighlight{styles}'
					}, {
						source: 'header #myAcctDropdown li, header #loginDropdown li{styles}',
						result: '.container header #myAcctDropdown li, .container header #loginDropdown li{styles}'
					}, {
						source: '@import url("fineprint.css") print;',
						result: '@import url("fineprint.css") print;'
					}, {
						source: '@import url("bluish.css") projection, tv;',
						result: '@import url("bluish.css") projection, tv;'
					}, {
						source: '@import \'custom.css\';',
						result: '@import \'custom.css\';'
					}, {
						source: '@import url("chrome://communicator/skin/");',
						result: '@import url("chrome://communicator/skin/");'
					}, {
						source: '@import "common.css" screen, projection;',
						result: '@import "common.css" screen, projection;'
					}, {
						source: '@import url(\'landscape.css\') screen and (orientation:landscape);',
						result: '@import url(\'landscape.css\') screen and (orientation:landscape);'
					});

					for (var i = 0, length = testQueue.length; i < length; i++) {
						setCssSourceCode(testQueue[i].source.replace('{styles}', testStylesString));
						styleProcessor.prefix('.container');

						equal(getCssSourceCode(), testQueue[i].result.replace('{styles}', testStylesString), 'Source code has wrong value');
					}

					styleProcessor.resolve(function(style) {
						equal(typeof(style), 'object', 'Returned module object is not object');
						equal(Object.keys(style).length, 3, 'Returned module object has wrong properties count');
						equal(typeof(style.cssNode), 'object', 'Link to style DOM element is not object');
						ok(style.cssNode instanceof HTMLElement, 'Link to style DOM element is not DOM node');
						notEqual(style.cssNode.parentNode, null, 'Link node should be placed in DOM');
						equal(typeof(style.append), 'function', 'Returned module does not have "append" method');
						equal(typeof(style.remove), 'function', 'Returned module does not have "remove" method');
					});

					// AMD JS Preprocessor part.
					stop();

					amdNoNameNoDepProcessor.resolve(function(result) {
						start();

						equal(typeof(result), 'object', 'Module resolving result should be object');
						equal(Object.keys(result).length, 2, 'Module resolving result should have 2 properties');
						equal(result.success, true, 'Module resolving result "success" property should be "true"');
						equal(result.deps.length, 0, 'Module should have no dependecies');

						stop();
						amdNoNameDepProcessor.resolve(function(result) {
							start();

							equal(typeof(result), 'object', 'Module resolving result should be object');
							equal(Object.keys(result).length, 2, 'Module resolving result should have 2 properties');
							equal(result.success, true, 'Module resolving result "success" property should be "true"');
							equal(result.deps.length, 1, 'Module should have 1 dependecy');
							equal(typeof(result.deps[0]), 'object', 'Module dependecy should be object');
							equal(result.deps[0].hello, 'world', 'Module dependecy "hello" property should be "world"');

							stop();

							amdNameNoDepProcessor.resolve(function(result) {
								start();
								amdNameNoDepResult = result;

								equal(typeof(result), 'object', 'Module resolving result should be object');
								equal(Object.keys(result).length, 2, 'Module resolving result should have 2 properties');
								equal(result.success, true, 'Module resolving result "success" property should be "true"');
								equal(result.deps.length, 0, 'Module should have no dependecies');

								stop();

								amdNameDepProcessor.resolve(function(result) {
									start();
									amdNameDepResult = result;

									equal(typeof(result), 'object', 'Module resolving result should be object');
									equal(Object.keys(result).length, 3, 'Module resolving result should have 3 properties');
									equal(result.id, 'name-dep', 'Module name should be resolved as "name-dep"');
									equal(result.success, true, 'Module resolving result "success" property should be "true"');
									equal(result.deps.length, 1, 'Module should have 1 dependecy');
									equal(typeof(result.deps[0]), 'object', 'Module dependecy should be object');
									equal(result.deps[0].hello, 'world', 'Module dependecy "hello" property should be "world"');

									stop();

									require(['name-dep', 'name-nodep'], function(nameDep, nameNoDep) {
										start();

										equal(nameDep, amdNameDepResult, 'Module resolving object should be equal');
										equal(nameNoDep, amdNameNoDepResult, 'Module resolving object should be equal');
									});
								});
							});
						});
					});
				});
			});
		}
	});
});

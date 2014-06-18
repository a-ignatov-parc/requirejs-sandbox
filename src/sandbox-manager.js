define([
	'logger/logger',
	'helpers/utils',
	'helpers/patch',
	'helpers/require'
], function(console, utils, patchAbstract, requireResolver) {
	var createdSandboxes = {},
		Sandbox = function(options) {
			// Создаем объект параметром на основе дефолтных значений и значений переданных при 
			// инициализации.
			this.options = utils.defaults(options, {
				debug: false,
				requireUrl: null,
				requireMain: null,
				requireConfig: {},
				sandboxLinks: {},
				patch: [],
				plugins: [],
				success: function() {},
				error: function() {}
			});

			// Создаем свойства класса.
			this.iframe = null;
			this.sandbox = null;
			this.requireUrl = null;

			// Создаем api объект песочницы.
			// С песочницей со статусом больше 0 дальнейшая работа не возможна.
			// Список доступных статусов:
			// 
			// * `-1` – Песочница не создана.
			// 
			// * `0` – Песочница создана без ошибок.
			// 
			// * `1` – Песочница не смогла зарезолвить ссылку до require.js.
			// 
			// * `2` – Песочница не смогла получить правильные ссылки для функций `require` 
			// и `define`.
			// 
			// * `3` – Загрузчик не смог загрузить файл с require.js в песочницу.
			this.api = {
				name: this.options.name,
				require: null,
				define: null,
				status: -1,
				destroy: utils.bind(function() {
					this.sandbox = null;
					this.iframe.parentNode.removeChild(this.iframe);
					this.iframe = null;

					// Рекурсивно удаляем свойства api песочницы.
					for (var key in this.api) {
						if (this.api.hasOwnProperty(key)) {
							delete this.api[key];
						}
					}
				}, this)
			};

			this.createSandbox(function(sandbox) {
				console.debug('Sandbox with name "' + this.options.name + '" is created!', sandbox, sandbox.document.body);

				// Прокидываем экспорты в песочницу.
				for (var key in this.options.sandboxLinks) {
					if (this.options.sandboxLinks.hasOwnProperty(key)) {
						sandbox[key] = this.options.sandboxLinks[key];
					}
				}

				// Добавляем публичное api в песочницу.
				this.sandbox.sandboxApi = utils.extend({}, this.api, {
					parentWindow: window
				});

				// Резолвим ссылку на require.js для песочницы.
				requireResolver.resolve(
					utils.bind(function(requireUrl) {
						// Сохраняем зарезовленный урл и создаем загрузчик в песочнице.
						this.requireUrl = requireUrl;
						this.createLoader(sandbox);
					}, this),
					utils.bind(function(errorMsg) {
						// Если колбек не объявлен, то выкидываем ошибку.
						this.api.status = this.sandbox.sandboxApi.status = 1;
						this.options.error.call(this.api);
						console.error(errorMsg);
					}, this),
				this.options);
			});
			return this.api;
		};

	Sandbox.prototype = {
		createSandbox: function(callback) {
			this.createFrame(null, utils.bind(function(iframe) {
				// Сохраняем ссылку на песочницу.
				this.iframe = iframe;

				// Получаем и сохраняем ссылку на объект `window` в созданом `sandbox`.
				this.sandbox = this.iframe.contentWindow;

				// Добавляем пустой элемент `script` в `head` `iframe` для правильной работы 
				// загрузчика.
				this.createScript(this.sandbox);

				if (typeof(callback) === 'function') {
					callback.call(this, this.sandbox);
				}
			}, this));
		},

		createFrame: function(src, callback) {
			var iframe = document.createElement('iframe'),
				readyStateHandler = function() {
					if (document.readyState === 'complete') {
						console.debug('DOM is ready. Appending iframe');

						document.body.appendChild(iframe);
						return true;
					}
					return false;
				},
				onLoadHandler = function() {
					if (typeof(callback) === 'function') {
						callback(iframe);
					}
				};

			// Устанавливаем необходимые атрибуты.
			iframe.style.display = 'none';
			iframe.src = src || 'javascript:0';
			iframe.tabIndex = -1;

			// Навешиваем обработчик на событие полной отрисовки _iframe_ и всего его содержимого
			if (iframe.addEventListener) {
				iframe.addEventListener('load', onLoadHandler, false);
			} else if (iframe.attachEvent) {
				iframe.attachEvent('onload', onLoadHandler);
			} else {
				iframe.onload = onLoadHandler;
			}

			if (!readyStateHandler()) {
				console.debug('DOM isn\'t ready. Subscribing to "onreadystatechange" event');

				document.onreadystatechange = (function(originalHandler) {
					return function() {
						var returnData;

						if (typeof(originalHandler) === 'function') {
							returnData = originalHandler.apply(this, arguments);
						}
						readyStateHandler.apply(this, arguments);
						return returnData;
					};
				})(document.onreadystatechange);
			}
		},

		createScript: function(window, src, dataAttributes, callback, error) {
			var script = null,
				loaded = false,
				successHandler,
				errorHandler;

			if (typeof(dataAttributes) === 'function') {
				errorHandler = callback;
				successHandler = dataAttributes;
				dataAttributes = void(0);
			} else {
				successHandler = callback;
				errorHandler = error;
			}

			if (window && window.document && window.document.body) {
				// Создаем тег `script`.
				script = window.document.createElement('script');

				// Если передан массив дата-аттрибутов, то добавляем его в тег.
				if (typeof(dataAttributes) === 'object') {
					for (var key in dataAttributes) {
						if (dataAttributes.hasOwnProperty(key) && dataAttributes[key] != null) {
							script.setAttribute('data-' + key, dataAttributes[key]);
						}
					}
				}

				// Если передан путь до файла, то указываем его у тега.
				switch (typeof(src)) {
					case 'string':
						if (src) {
							script.src = src;
						} else if (typeof(errorHandler) === 'function') {
							errorHandler(false, window);
							return;
						}
						break;
					case 'object':
					case 'undefined':
						if (typeof(errorHandler) === 'function') {
							errorHandler(false, window);
						}
						return;
				}

				// Если переданный аргумент `successHandler` - функция, то реалзиовываем кроссбраузерный 
				// колбек.
				if (typeof(successHandler) === 'function') {
					script.onload = script.onerror = script.onreadystatechange = function(event) {
						if (!loaded) {
							loaded = true;
							script.onload = script.onerror = script.onreadystatechange = null;

							if (event.type === 'load' || this.readyState === 'loaded' || this.readyState === 'complete') {
								successHandler(script, window);
							} else if (typeof(errorHandler) === 'function' && (event.type === 'error' || this.readyState === 'error')) {
								errorHandler(script, window);
							}
						}
					};
				}

				// Вставляем тег `script` в DOM.
				window.document.getElementsByTagName('head')[0].appendChild(script);
			}
		},

		createLoader: function(target) {
			var loadHandler = function(script, sandbox) {
					var patchList = this.options.patch,
						patchModule = function(module, patch) {
							patch.enable(window, sandbox, module);
							console.debug('Patch for module "' + patch.name + '" applied correctly');
						},
						success = utils.bind(function() {
							console.debug('Executing module callback');

							// Если в модуль был передана функция-обработчик, то вызываем ее, передавая в 
							// качестве аргументов ссылку на функцию `require` их песочницы.
							this.options.success.call(this.api, this.api.require, this.api.define);
						}, this),
						resolvePatch = function(patch) {
							for (var i = 0, length = patchList.length; i < length; i++) {
								if (typeof(patchList[i]) === 'string' && patch.name === patchList[i]) {
									patchList[i] = patch;
									console.debug('Patch "' + patch.name + '" is resolved.');
									break;
								}
							}

							if (!--unresolvedPatchesCount) {
								success();
							}
						},
						unresolvedPatchesCount = 0;

					// Создаем ссылку на `require.js` в api песочницы для дальнейшей работы с ним
					this.api.require = this.sandbox.sandboxApi.require = sandbox.require;
					this.api.define = this.sandbox.sandboxApi.define = sandbox.define;
					this.api.status = this.sandbox.sandboxApi.status = 0;

					// В режиме дебага добавляем в апи песочницы ссылку на инстанс менеджера.
					if (this.options.debug) {
						this.api.sandboxManager = this;
					}

					if (typeof(this.api.require) !== 'function' || typeof(this.api.define) !== 'function') {
						// Если мы не смогли получить доступ к функциям require.js внутри 
						// песочницы, то скорее всего мы ошибочно зарезолвили путь до библиотеки.
						// Сбрасываем резолвер.
						requireResolver.reset();

						// Сбрасываем статусы песочницы и вызываем обработку ошибки.
						this.api.status = this.sandbox.sandboxApi.status = 2;
						this.options.error.call(this.api);
						console.error('Can not gain access to require.js inside sandbox');
						return;
					}

					// Конфигурируем загрузчик на основе переданных параметров.
					this.api.require.config(this.options.requireConfig);

					// Создаем список плугинов, что указаны в конфиге
					for (var i = 0, length = this.options.plugins.length; i < length; i++) {
						var pluginObj = this.options.plugins[i],
							pluginName = '' + pluginObj.name,
							skipThisPlugin = false;

						if (!pluginName) {
							console.error('Registered plugin has no name');
							skipThisPlugin = true;
						}

						if (typeof(pluginObj.handler) !== 'function') {
							console.error('Registered plugin handler is not a function');
							skipThisPlugin = true;
						}

						console.debug('Successfuly registered plugin with name: ' + pluginName);

						// Регистрируем плугин.
						if (!skipThisPlugin) {
							this.api.define(pluginName, pluginObj.handler);
						}
					}

					console.debug('Creating predefined modules');

					// Для того чтоб разработчик могу получить доступ к объекту `window` 
					// песочницы, создаем модуль с названием `sandbox`.
					this.api.define('sandbox', function() {
						return sandbox;
					});

					console.debug('Creating handler for amd modules load');

					// Для того чтоб пропатчить модули до того как они будут зарезолвлены 
					// пользователю создаем обработчик который будет отлавливать момент 
					// загрузки + резолвинга и отслеживать нужные модули.
					this.api.require.onResourceLoad = function(context, map) {
						var module = context.defined[map.id],
							moduleName = map.name,
							patch;

						// Проверяем имя модуля и делаем его патч если необходимо.
						for (var i = 0, length = patchList.length; i < length; i++) {
							patch = patchList[i];

							if (patch.name == moduleName) {
								patchModule(module || sandbox[patch.shimName], patchList[i]);
							}
						}
					};

					console.debug('Checking for unresolved patches');

					// Так как при резолвинге нельзя делать отложенный патч модуля нужно 
					// разрезолвить все модули до окончательной инициализации песочницы.
					for (i = 0, length = patchList.length; i < length; i++) {
						if (typeof(patchList[i]) === 'string') {
							var patchName = ['requirejs-sandbox', 'patches', patchList[i]].join('/');

							if (window.require.defined(patchName)) {
								console.debug('Patch "' + patchName + '" is resolved in parent page. Linking with patch list...');
								patchList[i] = window.require(patchName);
							} else {
								unresolvedPatchesCount++;
								console.debug('Patch "' + patchName + '" is unresolved. Resolving...');
								window.require([patchName], resolvePatch);
							}
						}
					}

					// Если нет не зарезолвленных патчей то окончательно инициализируем песочницу.
					if (!unresolvedPatchesCount) {
						success();
					}
				};

			// Вставляем с песочницу скрипт reuqire.js.
			this.createScript(target, this.requireUrl, {
				main: this.options.requireMain
			}, utils.bind(loadHandler, this), utils.bind(function() {
				// Сбрасываем резолвер.
				requireResolver.reset();

				// Сбрасываем статусы песочницы и вызываем обработку ошибки.
				this.api.status = this.sandbox.sandboxApi.status = 3;
				this.options.error.call(this.api);
				console.error('Can not load require.js into sandbox');
			}, this));

			console.debug('Creating loader inside specified target:', target);
		}
	};

	// Конфигурируем логирование ошибок.
	console.setLogLevel('debug');
	console.setNamespace('requirejs-sandbox');

	return {
		_getSandboxConstructor: function() {
			return Sandbox.prototype;
		},

		get: function(name) {
			return createdSandboxes[name];
		},

		set: function(name, params) {
			var sandbox;

			if (typeof(name) === 'string') {
				sandbox = this.get(name);

				if (sandbox && sandbox.status <= 0) {
					console.warn('Sandbox with name: ' + name + ' already exist! Returning existed sandbox.', sandbox);
					return sandbox;
				}
				return createdSandboxes[name] = new Sandbox(utils.extend({}, params, {
					name: name
				}));
			} else {
				console.error('Sandbox name should be string');
			}
		},

		destroy: function(name) {
			var sandbox = this.get(name);

			if (sandbox) {
				sandbox.destroy();
				delete createdSandboxes[name];
			} else {
				console.warn('Sandbox with name: "' + name + '" was not found');
			}
		}
	};
});

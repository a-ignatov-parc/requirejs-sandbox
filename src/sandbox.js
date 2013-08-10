define('requirejs-sandbox', [
	'requirejs-sandbox/logger',
	'requirejs-sandbox/utils',
	'requirejs-sandbox/plugins/css',
	'requirejs-sandbox/plugins/transit'
], function(console, utils, cssPlugin, transitPlugin) {
	var createdSandboxes = {},
		Sandbox = function(options) {
			// Создаем объект параметром на основе дефолтных значений и значений переданных при 
			// инициализации.
			this.options = utils.extend({
				debug: false,
				requireUrl: null,
				requireMain: null,
				requireConfig: {}
			}, options);

			// Создаем свойства класса.
			this.iframe = null;
			this.sandbox = null;

			// Создаем api объект песочницы.
			// Список доступных статусов:
			// 
			// * `-1` – Песочница не создана.
			// 
			// * `0` – Песочница создана с ошибкой. Дальнейшая работа с такой песочницей не 
			// возможна.
			// 
			// * `1` – Песочница создана без ошибок.
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
				this.createLoader(sandbox);
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

		createScript: function(window, src, dataAttributes, callback) {
			var script = null,
				loaded = false;

			if (typeof(dataAttributes) === 'function' && callback == null) {
				callback = dataAttributes;
				dataAttributes = void(0);
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
				if (typeof(src) === 'string' && src) {
					script.src = src;
				}

				// Если переданный аргумент `callback` - функция, то реалзиовываем кроссбраузерный 
				// колбек.
				if (typeof(callback) === 'function') {
					script.onload = script.onreadystatechange = function() {
						if (!loaded && (this.readyState == null || this.readyState === 'loaded' || this.readyState === 'complete')) {
							loaded = true;
							script.onload = script.onreadystatechange = null;
							callback(window);
						}
					};
				}

				// Вставляем тег `script` в DOM.
				window.document.getElementsByTagName('head')[0].appendChild(script);
			}
		},

		createLoader: function(target) {
			var loadHandler = function(window) {
					// Создаем ссылку на `require.js` в api песочницы для дальнейшей работы с ним
					this.api.require = window.require;
					this.api.define = window.define;
					this.api.status = 1;

					// В режиме дебага добавляем в апи песочницы ссылку на инстанс менеджера.
					if (this.options.debug) {
						this.api.sandboxManager = this;
					}

					console.debug('require.js has loaded! Configuring...');

					// Конфигурируем загрузчик на основе переданных параметров.
					this.api.require.config(this.options.requireConfig);

					// Создаем плугин для загрузки транзитов и css.
					cssPlugin.create(window.define);
					transitPlugin.create(window.define, this.sandbox);

					console.debug('Executing module callback');

					// Если в модуль был передана функция-обработчик, то вызываем ее, передавая в 
					// качестве аргументов ссылку на функцию `require` их песочницы.
					if (typeof(this.options.callback) === 'function') {
						this.options.callback.call(this.api, window.require, window.define);
					}
				};

			if (this.options.requireUrl) {
				this.createScript(target, this.options.requireUrl, {
					main: this.options.requireMain
				}, utils.bind(loadHandler, this));
			} else {
				// [TODO] Тут реализуем механизм вставки `require.js` в песочницу если он встроен в данный
				// модуль.
				// 
				// Нужно для юзкейса, когда в странице куда встраивается виджет нет ни `require.js`
				// ни пользователю не охото заморачиваться с ссылкам, но зато он может собрать 
				// модуль с встроенным `require.js`.
				// 
				// А пока ничего не реализовано вызываем колбек без передеча ссылки на require.
				// Если колбек не объявлен, то выкидываем ошибку.
				this.api.status = 0;

				if (typeof(this.options.callback) === 'function') {
					this.options.callback.call(this.api);
				} else {
					throw 'Unable to alocate require.js. Creating sandbox failed!';
				}
			}
			console.debug('Creating loader inside specified target:', target);
		}
	};

	// Конфигурируем логирование ошибок.
	console.setLogLevel('debug');
	console.setNamespace('requirejs-sandbox');

	return {
		get: function(name) {
			return createdSandboxes[name];
		},
		set: function(name, params) {
			var sandbox;

			if (typeof(name) === 'string' && typeof(params) === 'object') {
				sandbox = this.get(name);

				if (sandbox && sandbox.status) {
					console.warn('Sandbox with name: ' + name + ' already exist! Returning existed sandbox.', sandbox);
					return sandbox;
				}
				return createdSandboxes[name] = new Sandbox(utils.extend({}, params, {
					name: name
				}));
			}
		},
		destroy: function(name) {
			var sandbox = this.get(name);

			if (sandbox) {
				sandbox.destroy();
				delete createdSandboxes[name];
			}
		}
	};
});

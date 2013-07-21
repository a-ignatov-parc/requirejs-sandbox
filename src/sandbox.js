// Пока в зависимостях запрашиваем `underscore`, для быстрой реализации первой версии.
// 
// [TODO] После устаканивания api избавиться от `underscore` реализовав/перенеся используемые 
// методы в код модуля.
define('requirejs-sandbox', ['requirejs-sandbox/transits', 'requirejs-sandbox/logger', 'requirejs-sandbox/utils'], function(transits, console, utils) {
	var createdSandboxes = {},
		Sandbox = function(options) {
			// Создаем объект параметром на основе дефолтных значений и значений переданных при 
			// инициализации.
			this.options = utils.extend({
				requireUrl: null,
				requireMain: null,
				requireConfig: {}
			}, options);

			// Создаем свойства класса.
			this.iframe = null;
			this.sandbox = null;
			this.api = {
				name: this.options.name,
				require: null,
				destroy: this.bind(function() {
					this.sandbox = null;
					this.iframe.parentNode.removeChild(this.iframe);
					this.iframe = null;
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
			this.createFrame(null, this.bind(function(iframe) {
				// Сохраняем ссылку на песочницу.
				this.iframe = iframe;

				// Получаем и сохраняем ссылку на объект `window` в созданом `sandbox`
				this.sandbox = this.iframe.contentWindow;

				// Добавляем пустой элемент `script` в `body` `iframe` для правильной работы загрузчика
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
						var returnData = originalHandler.apply(this, arguments);

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
				window.document.body.appendChild(script);
			}
		},

		createLoader: function(target) {
			var loadHandler = function(window) {
					// Создаем ссылку на `require.js` в api песочницы для дальнейшей работы с ним
					this.api.require = window.require;

					console.debug('require.js has loaded! Configuring...');

					// Конфигурируем загрузчик на основе переданных параметров.
					this.api.require.config(this.options.requireConfig);

					// Создаем плугин для загрузки транзитов и css.
					this.createTransitPlugin(window.define);
					this.createCssPlugin(window.define);

					console.debug('Executing module callback');

					// Если в модуль был передана функция-обработчик, то вызываем ее, передавая в 
					// качестве аргументов ссылку на функцию `require` их песочницы.
					if (typeof(this.options.callback) === 'function') {
						this.options.callback(window.require);
					}
				};

			if (this.options.requireUrl) {
				this.createScript(target, this.options.requireUrl, {
					main: this.options.requireMain
				}, this.bind(loadHandler, this));
			} else {
				// Тут реализуем механизм вставки `require.js` в песочницу если он встроен в данный
				// модуль.
				// 
				// Нужно для юзкейса, когда в странице куда встраивается виджет нет ни `require.js`
				// ни пользователю не охото заморачиваться с ссылкам, но зато он может собрать 
				// модуль с встроенным `require.js`.
				// 
				// code here...
				// 
				// А пока ничего не реализовано выкидываем ошибку
				throw 'Unable to create loader';
			}
			console.debug('Creating loader inside specified target:', target);
		},

		createTransitPlugin: function(define) {
			var sandbox = this.sandbox;

			console.debug('Creating plugin for loading transits');

			define('transit', function() {
				return {
					load: function (name, req, onload) {
						console.debug('Received module load exec for', name);

						// Загружаем модуль и если транзит для этого модуля существует, то делаем 
						// патч.
						req([name], function(module) {
							onload(module);

							// Если транзит для данного модуля существует, то инициализируем его.
							if (transits[name]) {
								try {
									transits[name].enable(window, sandbox, module);
								} catch(e) {
									console.error(e);
								}
							}
						});
					}
				};
			});
		},

		createCssPlugin: function(define) {
			console.debug('Creating plugin for loading css');

			define('css', this.bind(function() {
				return {
					load: this.bind(function(name, req, onload, options) {
						var url = options.baseUrl + name + '.css';

						console.debug('Received css load exec for', name);

						// Загружаем css в основной документ через iframe чтоб файл закешировался 
						// и мы могли получить событие `onload`, а затем вставляем файл через 
						// обычный `link` и вызываем `require.js` хендлер `onload` сообщающий о 
						// завершении загрузки.
						this.createFrame(url, function(iframe) {
							console.debug('frame with css is loaded. Appending link and removing frame');

							// Создаем тег `link`.
							var link = window.document.createElement('link');

							// Устанавливаем необходимые атрибуты.
							link.rel = 'stylesheet';
							link.type = 'text/css';
							link.href = url;

							// Вставляем тег `link` в DOM.
							window.document.body.appendChild(link);

							// Удаляем фрейм, так как он больше не нужен.
							iframe.parentNode.removeChild(iframe);

							// Вызываем метод `onload` символизирующий окончание загрузки.
							onload({
								cssLink: link
							});
						});
					}, this)
				};
			}, this));
		},

		bind: function(fn, context) {
			context || (context = window);

			if (typeof(fn) === 'function') {
				return function() {
					return fn.apply(context, arguments);
				};
			}
			return fn;
		}
	};

	// Конфигурируем логирование ошибок.
	console.setLogLevel('debug');
	console.setNamespace('requirejs-sandbox');

	return {
		get: function(name) {
			if (createdSandboxes[name]) {
				return createdSandboxes[name];
			}
		},
		set: function(name, params) {
			var sandbox;

			if (typeof(name) === 'string' && typeof(params) === 'object') {
				if (sandbox = this.get(name)) {
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
			}
		}
	};
});

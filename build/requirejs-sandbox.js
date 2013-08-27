/**
 * requrejs-sandbox - v0.1.5-22 (build date: 27/08/2013)
 * https://github.com/a-ignatov-parc/requirejs-sandbox
 * Sandbox manager for requre.js to run dedicated apps
 * Copyright (c) 2013 Anton Ignatov
 * Licensed MIT
 */
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
				requireConfig: {},
				sandboxExport: {}
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

				// Прокидываем экспорты в песочницу.
				for (var key in this.options.sandboxExport) {
					if (this.options.sandboxExport.hasOwnProperty(key)) {
						sandbox[key] = this.options.sandboxExport[key];
					}
				}

				// Добавляем публичное api в песочницу.
				this.sandbox.sandboxApi = utils.extend({}, this.api, {
					parentWindow: window
				});

				// Создаем загрузчик в песочнице.
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
					this.api.require = this.sandbox.sandboxApi.require = window.require;
					this.api.define = this.sandbox.sandboxApi.define = window.define;
					this.api.status = this.sandbox.sandboxApi.status = 1;

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
				this.api.status = this.sandbox.sandboxApi.status = 0;

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

define('requirejs-sandbox/transits', [
	'requirejs-sandbox/transit.jquery'
], function() {
	var transits = {};

	// Создаем справочник транзитов
	for (var i = 0, length = arguments.length; i < length; i++) {
		if (arguments[i] != null) {
			transits[arguments[i].name] = arguments[i];
		}
	}
	return transits;
});

define('requirejs-sandbox/transit.jquery', [
	'requirejs-sandbox/logger'
], function(console) {
	return {
		name: 'jquery',
		enable: function(window, sandbox, jQuery) {
			// Проверка на существование `jQuery`
			if (typeof(jQuery) !== 'function') {
				console.error('This transit require jQuery to be defined!');
				return;
			}

			// Переопределяем метод `getComputedStyle` в песочнице чтоб он ссылался на соответсвующий метод в 
			// основном документе иначе в jquery версии 1.8.x и старше будут не правильно определятся 
			// видимость элементов и некоторые другие стили.
			if (sandbox.getComputedStyle && window.getComputedStyle) {
				sandbox.getComputedStyle = function() {
					return window.getComputedStyle.apply(window, arguments);
				};
			}

			// Проверяем не сделан ли уже патч `jQuery`, если сделан, то выходим.
			if (jQuery.fn.__patchedInit) {
				console.debug('jQuery already patched. Skipping...');
				return;
			}

			// Делаем обертку над `jQuery.fn.init` для возможносит прозрачного переброса селекторов на 
			// основную страницу.
			// 
			// Возможен небольшой хак чтоб получить `jQuery` объект для песочницы. Необходимо в качестве 
			// селектора передать объект `window` песочница, так же этот же `window` передать в качестве 
			// контекста.
			// 
			// __Пример:__  
			// 
			//         $sandbox = $(sandbox, sandbox);
			jQuery.fn.init = (function(Fn, proto) {
				// Запоминаем изначальный метод `init` для последующего его востановления в 
				// исходное состояние, если потребуется.
				if (!proto.__originalInit) {
					proto.__originalInit = Fn;
				}

				// Создаем новый, пропатченный, метод `init`.
				proto.__patchedInit = function(selector, context, rootjQuery) {
					if (typeof(selector) === 'string' && !context) {
						return new Fn(selector, window.document, rootjQuery);
					} else if (selector == sandbox && context != sandbox) {
						return new Fn(window, context, rootjQuery);
					} else if (selector == sandbox.document) {
						return new Fn(window.document, context, rootjQuery);
					} else if (selector == sandbox.document.head) {
						return new Fn(window.document.head, context, rootjQuery);
					} else if (selector == sandbox.document.body) {
						return new Fn(window.document.body, context, rootjQuery);
					} else {
						return new Fn(selector, context, rootjQuery);
					}
				};

				// Проставляем у нашей функции-оболочки в качестве прототипа прототип jQuery
				proto.__patchedInit.prototype = proto;
				return proto.__patchedInit;
			})(jQuery.fn.init, jQuery.fn);
		},
		disable: function(window, sandbox, jQuery) {
			if (jQuery.fn.__originalInit) {
				console.debug('Restoring original jQuery instance');

				jQuery.fn.init = jQuery.fn.__originalInit;
				delete jQuery.fn.__originalInit;
				delete jQuery.fn.__patchedInit;
			} else {
				console.warn('jQuery wasn\'t patched. Skipping...');
			}
		}
	};
});

/* jshint -W089 */
define('requirejs-sandbox/utils', function() {
	var ArrayProto = Array.prototype,
		ObjProto = Object.prototype,
		hasOwnProperty = ObjProto.hasOwnProperty,
		nativeForEach = ArrayProto.forEach,
		slice = ArrayProto.slice,
		breaker = {};

	return {
		// Метод `has` позаимствованный из `underscore.js`
		has: function(obj, key) {
			return hasOwnProperty.call(obj, key);
		},

		// Метод `each` позаимствованный из `underscore.js`
		each: function(obj, iterator, context) {
			if (obj == null) {
				return;
			}

			if (nativeForEach && obj.forEach === nativeForEach) {
				obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
				for (var i = 0, l = obj.length; i < l; i++) {
					if (iterator.call(context, obj[i], i, obj) === breaker) {
						return;
					}
				}
			} else {
				for (var key in obj) {
					if (this.has(obj, key)) {
						if (iterator.call(context, obj[key], key, obj) === breaker) {
							return;
						}
					}
				}
			}
		},

		// Метод `extend` позаимствованный из `underscore.js`
		extend: function(obj) {
			this.each(slice.call(arguments, 1), function(source) {
				if (source) {
					for (var prop in source) {
						obj[prop] = source[prop];
					}
				}
			});
			return obj;
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
});

define('requirejs-sandbox/plugins/css', [
	'requirejs-sandbox/utils'
], function(utils) {
	return {
		create: function(define) {
			console.debug('Creating plugin for loading css');

			define('css', utils.bind(function() {
				return {
					load: utils.bind(function(name, req, onload) {
						console.debug('Received css load exec for', name);

						var url = req.toUrl(name + '.css'),
							link = window.document.createElement('link'),
							loader = window.document.createElement('img');

						// Устанавливаем необходимые атрибуты.
						link.rel = 'stylesheet';
						link.type = 'text/css';
						link.href = url;

						// Вставляем тег со стилями в тег `head`
						document.getElementsByTagName('head')[0].appendChild(link);

						// Навешиваем событие на ошибку загрузки, так как изображаение выдаст это
						// событие, когда загрузит указанный файл, что нам и нужно для определения 
						// загрузились ли стили или нет.
						loader.onerror = function() {
							// Вызываем обработчик загруки модуля.
							onload({
								cssLink: link
							});
						};

						// Выставляем урл для начала загрузки.
						loader.src = url;
					}, this)
				};
			}, this));
		}
	};
});

define('requirejs-sandbox/plugins/transit', [
	'requirejs-sandbox/transits'
], function(transits) {
	return {
		create: function(define, sandbox) {
			console.debug('Creating plugin for loading transits');

			define('transit', function() {
				return {
					load: function (name, req, onload) {
						console.debug('Received module load exec for', name);

						// Загружаем модуль и если транзит для этого модуля существует, то делаем 
						// патч.
						req([name], function(module) {
							// Если транзит для данного модуля существует, то инициализируем его.
							if (transits[name]) {
								try {
									transits[name].enable(window, sandbox, module);
								} catch(e) {
									console.error(e);
								}
							}

							// После инициализации транзита, если он был найден, вызываем 
							// обработчик `require.js` `onload`, который обозначает завершение 
							// работ плугина.
							onload(module);
						});
					}
				};
			});
		}
	};
});

define('requirejs-sandbox/logger', function() {
	var Logger = function() {
		var levels = {
				debug: 1,
				info: 2,
				warn: 4,
				error: 8,
				off: 100
			},
			logLevel = levels.warn,
			namespace = 'logger',
			console = {
				log: function() {},
				info: function() {},
				warn: function() {},
				error: function() {}
			};

		// для корректной работы в ie9
		if (Function.prototype.bind && window.console && typeof window.console.log === 'object') {
			['log', 'info', 'warn', 'error'].forEach(function(method) {
				console[method] = this.bind(window.console[method], window.console);
			}, Function.prototype.call);
		} else if (window.console) {
			console = window.console;
		}

		var log = function(data, level) {
			data = Array.prototype.slice.call(data);

			if (level >= logLevel) {
				var hdlr = console.log,
					prefix = '[' + namespace + ']';

				if (level === levels.warn && console.warn) {
					hdlr = console.warn;
					prefix += '[warn]';
				} else if (level === levels.error && console.error) {
					hdlr = console.error;
					prefix += '[ERR]';
				} else if (level === levels.info && console.info) {
					hdlr = console.info;
				}
				data.unshift(prefix);
				hdlr.apply(console, data);
			}
		};

		return {
			setLogLevel: function(level) {
				if (!levels[level]) {
					throw 'unknown log level: ' + level;
				}
				logLevel = levels[level];
			},
			setNamespace: function(ns) {
				namespace = ns;
			},
			debug: function() {
				log(arguments, levels.debug);
			},
			info: function() {
				log(arguments, levels.info);
			},
			warn: function() {
				log(arguments, levels.warn);
			},
			error: function() {
				log(arguments, levels.error);
			},
			off: function() {
				logLevel = levels.OFF;
			}
		};
	};
	return new Logger();
});

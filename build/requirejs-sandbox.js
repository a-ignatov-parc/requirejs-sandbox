/**
 * requrejs-sandbox - v0.1.4-106 (build date: 04/08/2013)
 * https://github.com/a-ignatov-parc/requirejs-sandbox
 * Sandbox manager for requre.js to run dedicated apps
 * Copyright (c) 2013 [object Object]
 * Licensed MIT
 */
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
				destroy: this.bind(function() {
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
				window.document.body.appendChild(script);
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
					this.createTransitPlugin(window.define);
					this.createCssPlugin(window.define);

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
				}, this.bind(loadHandler, this));
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
		},

		// Метод, который преобразует имя модуля в путь с учетом колекции `path` из конфига 
		// `require.js`.
		nameToUrl: function(name, options) {
			options || (options = this.options.requireConfig);

			var paths = options.paths,
				pathNameArr = location.pathname.split('/'),
				baseUrlArr = options.baseUrl.split('/'),
				pathArr;

			pathNameArr.pop();
			baseUrlArr = pathNameArr.concat(baseUrlArr);

			if (!baseUrlArr[baseUrlArr.length - 1]) {
				baseUrlArr.pop();
			}

			for (var path in paths) {
				if (paths.hasOwnProperty(path) && !name.indexOf(path)) {
					name = name.replace(path, '').substr(1);
					pathArr = paths[path].split('/');

					for (var i = 0, length = pathArr.length; i < length; i++) {
						if (pathArr[i] == '..') {
							baseUrlArr.pop();
						} else {
							baseUrlArr.push(pathArr[i]);
						}
					}
					break;
				}
			}

			if (name) {
				baseUrlArr.push(name);
			}
			return baseUrlArr.join('/');
		},

		createCssPlugin: function(define) {
			console.debug('Creating plugin for loading css');

			define('css', this.bind(function() {
				return {
					load: this.bind(function(name, req, onload, options) {
						console.debug('Received css load exec for', name);

						var url = this.nameToUrl(name, options) + '.css',
							link = window.document.createElement('link'),
							loader = window.document.createElement('img');

						// Устанавливаем необходимые атрибуты.
						link.rel = 'stylesheet';
						link.type = 'text/css';

						// Проверяем поддерживает браузер событие `onload` на теге `link`.
						// Если поддерживает, то дело в шляпе. Если же нет, то используем хак пытаясь 
						if ('onload' in link) {
							link.onload = function() {
								onload({
									cssLink: link
								});
							};
							link.href = url;

							// Вставляем тег `link` в DOM.
							window.document.body.appendChild(link);
						} else {
							loader.onerror = function() {
								// В момент, когда вызовется обработчик ошибки файл уже будет 
								// загружен и закеширован, поэтому вставяем в линк урл.
								link.href = url;

								// Вставляем тег `link` в DOM.
								window.document.body.appendChild(link);

								// Вызываем обработчик загруки модуля.
								onload({
									cssLink: link
								});
							};

							// Выставляем урл для начала загрузки.
							loader.src = url;
						}
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

define('requirejs-sandbox/transits', ['requirejs-sandbox/transit.jquery'], function() {
	var transits = {};

	// Создаем справочник транзитов
	for (var i = 0, length = arguments.length; i < length; i++) {
		if (arguments[i] != null) {
			transits[arguments[i].name] = arguments[i];
		}
	}
	return transits;
});

define('requirejs-sandbox/transit.jquery', ['requirejs-sandbox/logger'], function(console) {
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

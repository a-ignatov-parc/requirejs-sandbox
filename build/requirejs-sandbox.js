/**
 * requirejs-sandbox - v0.4.2-64 (build date: 14/03/2014)
 * https://github.com/a-ignatov-parc/requirejs-sandbox
 * Sandbox manager for require.js allows user to run multiple apps without scope intersection issues
 * Copyright (c) 2014 Anton Ignatov
 * Licensed MIT
 */
define('requirejs-sandbox/logger/logger',function() {
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
			log: function() {
				this.debug.apply(this, arguments);
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

define('requirejs-sandbox/helpers/utils',function() {
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
		},

		defaults: function(obj) {
			this.each(slice.call(arguments, 1), function(source) {
				if (source) {
					for (var prop in source) {
						if (obj[prop] === void 0) {
							obj[prop] = source[prop];
						}
					}
				}
			});
			return obj;
		},

		scripts: function() {
			return Array.prototype.slice.call(document.getElementsByTagName('script'), 0);
		}
	};
});

define('requirejs-sandbox/helpers/patch',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils'],function(console, utils) {
	var defaults = {
			_options: {},

			name: 'default',

			shimName: 'default',

			// Метод инициализации патча.
			enable: function() {
				console.warn('Method is not implemented');
			},

			disable: function() {
				console.warn('Method is not implemented');
			},

			setOptions: function(options) {
				var Wrapper = function(options) {
						this._options = utils.extend({}, this._options, options);
					};

				Wrapper.prototype = this;
				return new Wrapper(options);
			}
		};

	return {
		init: function(obj) {
			return utils.defaults(obj || {}, defaults);
		}
	};
});

define('requirejs-sandbox/helpers/resolvers/abstract',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils'],function(console, utils) {
	var abstractObj = {
			STATE_IDLE: 'idle',
			STATE_RESOLVING: 'resolving',
			STATE_RESOLVED: 'resolved',

			_state: null,
			_resolvedUrl: false,

			_onSuccess: function() {
				console.warn('No success handler defined for ' + this.id + ' resolver! Use _setHandlers() method to do this.');
			},

			_onFail: function() {
				console.warn('No fail handler defined for ' + this.id + ' resolver! Use _setHandlers() method to do this.');
			},

			_setHandlers: function(onResolve, onFail) {
				if (typeof(onResolve) === 'function') {
					this._onSuccess = onResolve;
				}
				if (typeof(onFail) === 'function') {
					this._onFail = onFail;
				}
			},

			_hanldleResolver: function() {
				switch (this.state()) {
					case this.STATE_RESOLVED:
						console.debug(this.id + ' resolver: resolved', this._resolvedUrl);
						this._onSuccess(this._resolvedUrl);
						return this._resolvedUrl;
					case this.STATE_IDLE:
						console.debug(this.id + ' resolver: failed to resolve');
						this._onFail();
						return;
					default:
						return;
				}
			},

			_getScripts: function() {
				return utils.scripts();
			},

			state: function() {
				return this._state;
			},

			resolve: function() {
				console.error('Not implemented!');
			},

			reset: function() {
				this._state = this.STATE_IDLE;
				return this;
			}
		};

	return abstractObj.reset();
});

define('requirejs-sandbox/helpers/resolvers/optionsResolver',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils','requirejs-sandbox/helpers/resolvers/abstract'],function(console, utils, abstract) {
	return utils.defaults({
		id: 'options',

		resolve: function(onResolve, onFail, options) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				console.debug(this.id + ' resolver: starting resolving');

				if (options && typeof(options.requireUrl) === 'string') {
					this._resolvedUrl = options.requireUrl;
					this._state = this.STATE_RESOLVED;
				}
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

define('requirejs-sandbox/helpers/resolvers/scriptResolver',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils','requirejs-sandbox/helpers/resolvers/abstract'],function(console, utils, abstract) {
	var regex = /require(?:[.-]min)?.js$/;

	return utils.defaults({
		id: 'script',

		_checkUrl: function(url) {
			return regex.test(url);
		},

		resolve: function(onResolve, onFail) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				console.debug(this.id + ' resolver: starting resolving');

				utils.each(this._getScripts(), utils.bind(function(scriptNode) {
					if (this._checkUrl(scriptNode.getAttribute('src'))) {
						this._resolvedUrl = scriptNode.getAttribute('src');
						this._state = this.STATE_RESOLVED;
						return true;
					}
				}, this));
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

define('requirejs-sandbox/helpers/resolvers/iframeResolver',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils','requirejs-sandbox/helpers/resolvers/abstract'],function(console, utils, abstract) {
	var sandboxContructor;

	function checkScript(scripts, sandbox, createScript, callback) {
		if (scripts.length) {
			createScript(sandbox, scripts.shift().getAttribute('src'), function(script) {
				if (typeof(sandbox.require) === 'function' && typeof(sandbox.requirejs) === 'function' && typeof(sandbox.define) === 'function') {
					callback(script.getAttribute('src'));
				} else {
					checkScript(scripts, sandbox, createScript, callback);
				}
			}, function() {
				checkScript(scripts, sandbox, createScript, callback);
			});
		} else {
			callback(false);
		}
	}

	return utils.defaults({
		id: 'iframe',

		resolve: function(onResolve, onFail) {
			var scripts;

			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				// Получаем список скриптов которые в дальнейшем будем проверять.
				scripts = this._getScripts();

				console.debug(this.id + ' resolver: starting resolving');

				if (scripts.length) {
					this._state = this.STATE_RESOLVING;

					if (!sandboxContructor) {
						sandboxContructor = window.require('requirejs-sandbox')._getSandboxConstructor();
					}

					// Создаем песочницу для поиска require.js среди скриптов загруженных на 
					// странице.
					sandboxContructor.createFrame(null, utils.bind(function(iframe) {
						var sandbox = iframe.contentWindow;

						// Во избежания отображения не нужных ошибок в консоль во время проверки 
						// переопределяем в посочнице метод `onerror`.
						sandbox.onerror = function() {};

						// Начинаем проверку всех доступных скриптов на странице в поисках 
						// require.js
						checkScript(scripts, sandbox, sandboxContructor.createScript, utils.bind(function(url) {
							if (url) {
								this._resolvedUrl = url;
								this._state = this.STATE_RESOLVED;
							} else {
								this._state = this.STATE_IDLE;
							}

							// После завершения всех проверок удаляем проверочную песочницу за ее 
							// ненадобностью.
							iframe.parentNode.removeChild(iframe);
							iframe = sandbox = scripts = null;

							// Вызываем хендлеры в зависимости от текущего состояния.
							this._hanldleResolver();
						}, this));
					}, this));
				}
			} else if (this.state() == this.STATE_RESOLVED) {
				return this._resolvedUrl;
			}
		}
	}, abstract);
});

define('requirejs-sandbox/helpers/resolvers/cdnResolver',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils','requirejs-sandbox/helpers/resolvers/abstract'],function(console, utils, abstract) {
	return utils.defaults({
		id: 'cdn',

		_resolvedUrl: '//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.9/require.min.js',

		resolve: function(onResolve) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve);
				console.debug(this.id + ' resolver: starting resolving');
				this._state = this.STATE_RESOLVED;
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

define('requirejs-sandbox/helpers/require',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils','requirejs-sandbox/helpers/resolvers/optionsResolver','requirejs-sandbox/helpers/resolvers/scriptResolver','requirejs-sandbox/helpers/resolvers/iframeResolver','requirejs-sandbox/helpers/resolvers/cdnResolver'],function(console, utils, optionsResolver, scriptResolver, iframeResolver, cdnResolver) {
	var resolvedUrl = false,
		resolveQueueIndex = 0,
		resolveQueue = [optionsResolver, scriptResolver, iframeResolver, cdnResolver],
		handlersQueue = [],
		inProgress = false;

	function success(value) {
		utils.each(handlersQueue, function(args) {
			if (typeof(args[0]) === 'function') {
				args[0](value);
			} else {
				error('No fail handler', args[1] || false);
			}
		});

		// Так как мы завершили поиску url, то выставляем флаг в неактивное состояние.
		inProgress = false;
		handlersQueue.length = resolveQueueIndex = 0;
	}

	function error(msg, handler) {
		if (handler != null) {
			if (typeof(handler) === 'function') {
				handler(msg);
			} else {
				throw msg;
			}
		} else {
			utils.each(handlersQueue, function(args) {
				error(msg, args[1] || false);
			});

			// Так как мы завершили поиску url, то выставляем флаг в неактивное состояние.
			inProgress = false;
			handlersQueue.length = resolveQueueIndex = 0;
		}
	}

	return {
		id: 'main',

		resolved: function() {
			return !!resolvedUrl;
		},

		reset: function() {
			resolvedUrl = false;
			utils.each(resolveQueue, function(resolver) {
				resolver.reset();
			});
		},

		resolve: function() {
			var _this = this,
				args;

			// Чтоб небыло проблем с несколькими запросами на резолв урла мы помещаем все запросы 
			// в очередь и запускаем один процесс резолвинга. Как только попытка резуолвинга 
			// закончилась, не важно успешно или нет, мы для всех элементов очереди сообщаем 
			// результаты.
			// 
			// В аргументах должны передаваться следующие значения:
			// `arguments[0]` – onResolveHandler
			// `arguments[1]` – onFailHandler
			// `arguments[2]` – options
			if (arguments.length) {
				handlersQueue.push(args = arguments);
			} else if (handlersQueue.length) {
				args = handlersQueue[0];
			} else {
				console.error('No handlers passed');
				return;
			}

			// Если резолвинг уже в процессе, то выходим из метода, так как хендлеры уже все равно
			// добавленны в очередь на обработку.
			if (inProgress && arguments.length) {
				return;
			}

			// Выставляем флаг о том что процесс резолвинга начался.
			inProgress = true;

			// Проверяем, если url уже зарезолвен, то сразу же выдаем результат без запуска 
			// очередного этапа поиска.
			// Если же урл еще не найден, то запускаем механизм поиска.
			if (this.resolved()) {
				console.debug(this.id + ' resolver: already resolved as', resolvedUrl);
				success(resolvedUrl);
				return resolvedUrl;
			} else if (resolveQueue[resolveQueueIndex] != null) {
				console.debug(this.id + ' resolver: starting "' + resolveQueue[resolveQueueIndex].id + '" resolver');

				resolveQueue[resolveQueueIndex].resolve(function(url) {
					success(resolvedUrl = url);
				}, function() {
					resolveQueueIndex++;
					_this.resolve();
				}, args[2]);
			} else {
				console.debug(this.id + ' resolver: all resolvers failed');
				error('Unable to resolve require.js source url');
			}
		}
	};
});

define('requirejs-sandbox',['requirejs-sandbox/logger/logger','requirejs-sandbox/helpers/utils','requirejs-sandbox/helpers/patch','requirejs-sandbox/helpers/require'],function(console, utils, patchAbstract, requireResolver) {
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
					var patchList = this.options.patch;

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

					console.debug('require.js has loaded! Patching "load" method...');

					// Переопределяем загрузчик чтоб можно было легко применять патчи.
					this.api.require.load = (function(load) {
						return function(context) {
							if (!context.completeLoad.isOverided) {
								context.completeLoad = (function(completeLoad) {
									return function(moduleName) {
										var fnContext = this,
											fnArgs = arguments,
											patchIsResolved,
											patchName,
											registry,
											module,
											patchModule = function(module, patch) {
												patch.enable(window, sandbox, module);
												console.debug('Patch for module "' + moduleName + '" applied correctly');
											},
											applyPatch = function(patch) {
												console.debug('Found patch for loaded module: "' + moduleName + '"! Applying...');

												// Если патч для данного модуля существует, то инициализируем его.
												if (patch) {
													try {
														registry = fnContext.registry[moduleName];
														module = registry && registry.shim && registry.shim.exportsFn() || sandbox[patch.shimName];

														if (module == null) {
															if (registry && registry.events.defined && typeof(registry.events.defined.push) === 'function') {
																registry.events.defined.push(function(module) {
																	patchModule(module, patch);
																});

																// Резолвим загрузку модуля.
																completeLoad.apply(fnContext, fnArgs);
															} else {
																throw 'Module registry does not have defined event';
															}
														} else {
															patchModule(module, patch);

															// Резолвим загрузку модуля.
															completeLoad.apply(fnContext, fnArgs);
														}
													} catch(e) {
														console.debug('Patch for module "' + moduleName + '" did not applied correctly! Look into debug info for more details');
														console.error(moduleName, e);
													}
												}
											};

										// Проверяем имя модуля и делаем его патч если необходимо.
										for (var i = 0, length = patchList.length; i < length; i++) {
											if (typeof(patchList[i]) === 'string') {
												patchName = patchList[i];
												patchIsResolved = false;
											} else if (typeof(patchList[i]) === 'object' && typeof(patchList[i].enable) === 'function') {
												patchName = patchList[i].name;
												patchIsResolved = true;
											} else {
												patchName = false;
												patchIsResolved = false;
											}

											if (patchName == moduleName) {
												if (patchIsResolved) {
													applyPatch(patchList[i]);
												} else {
													window.require([['requirejs-sandbox', 'patches', moduleName].join('/')], applyPatch);
												}
												return;
											}
										}
										return completeLoad.apply(fnContext, fnArgs);
									};
								})(context.completeLoad);

								// Высталяем флаг о том что мы переопределили хендлер и делать это 
								// повторно не нужно.
								context.completeLoad.isOverided = true;
							}

							// Запускаем загрузку модулей.
							load.apply(this, arguments);
						};
					})(this.api.require.load);

					console.debug('require.js "load" method has been patched! Configuring...');

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

					console.debug('Executing module callback');

					// Если в модуль был передана функция-обработчик, то вызываем ее, передавая в 
					// качестве аргументов ссылку на функцию `require` их песочницы.
					this.options.success.call(this.api, this.api.require, this.api.define);
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


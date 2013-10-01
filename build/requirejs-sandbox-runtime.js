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
	'requirejs-sandbox/utils',
	'requirejs-sandbox/logger'
], function(utils, console) {
	return {
		create: function(define) {
			console.debug('Creating plugin for loading css');

			define('css', utils.bind(function() {
				return {
					load: utils.bind(function(name, req, onload) {
						console.debug('Received css load exec for', name);

						var url = req.toUrl(name + '.css'),
							link = window.document.createElement('link'),
							hasStyleSheet = 'sheet' in link,
							loadHandler = function() {
								// Вызываем колбек о завершении загрузки.
								if (!cssHasLoaded) {
									onload({
										cssLink: link
									});
									cssTimeout && clearTimeout(cssTimeout);
									cssHasLoaded = true;
								}
							},
							count = 0,
							cssHasLoaded = false,
							cssTimeout,
							loader;

						// Устанавливаем необходимые атрибуты.
						link.rel = 'stylesheet';
						link.type = 'text/css';
						link.href = url;

						// Добавляем обработчики события `onload`
						// 
						// Браузеры: Chromium 22+, Firefox 20+, IE10+
						link.onload = link.onreadystatechange = loadHandler;

						// Если браузер поддерживает свойство `sheet` у элемента link, то 
						// запускаем рантайм ожидания загрузки.
						// 
						// Браузеры: Chromium 5+
						if (hasStyleSheet) {
							(function() {
								// Если css еще не загружен, то пытаемся получить доступ к сетке стилей. 
								// Если попытка проваливается, то ждем 20мс и пробуем сново.
								try {
									link.sheet.cssRules;
								} catch (e) {
									if (count++ < 1000) {
										cssTimeout = setTimeout(arguments.callee, 20);
									} else {
										console.error('Load failed in FF for', name);
									}
									return;
								}

								if (link.sheet.cssRules && link.sheet.cssRules.length === 0) {
									console.error('Load failed in Webkit for', name);
								} else {
									loadHandler();
								}
							})();
						}

						// Вставляем тег со стилями в тег `head`
						document.getElementsByTagName('head')[0].appendChild(link);

						// Если же браузер не поддерживает свойство `sheet`, то пытаемся загрузить через хак с элементов `img`
						// 
						// Браузеры: Opera 12
						if (!hasStyleSheet) {
							loader = window.document.createElement('img');
							loader.onerror = function() {
								// Вызываем обработчик загруки модуля.
								loadHandler();
							};

							// Выставляем урл для начала загрузки.
							loader.src = url;
						}
					}, this)
				};
			}, this));
		}
	};
});

define('requirejs-sandbox/plugins/transit', function() {
	return {
		create: function(define) {
			define('transit', function() {
				return {
					load: function (name, req, onload) {
						req([name], function(module) {
							onload(module);
						});
					}
				};
			});
		}
	};
});

require([
	'requirejs-sandbox/plugins/css',
	'requirejs-sandbox/plugins/transit'
], function(cssPlugin, transitPlugin) {
	cssPlugin.create(window.define);
	transitPlugin.create(window.define);
	return true;
});

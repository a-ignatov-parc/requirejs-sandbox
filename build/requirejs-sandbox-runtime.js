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
	var urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/;

	return {
		// Метод, который преобразует имя модуля в путь с учетом колекции `path` из конфига 
		// `require.js`.
		nameToUrl: function(name, options) {
			options || (options = this.options.requireConfig);

			var paths = options.paths,
				pathNameArr = location.pathname.split('/'),
				baseUrlArr = options.baseUrl.split('/'),
				pathArr;

			pathNameArr.pop();

			if (baseUrlArr[0] !== '') {
				baseUrlArr = pathNameArr.concat(baseUrlArr);
			}

			if (!baseUrlArr[baseUrlArr.length - 1]) {
				baseUrlArr.pop();
			}

			for (var path in paths) {
				if (paths.hasOwnProperty(path) && !name.indexOf(path)) {
					name = name.replace(path, '').substr(1);

					if (urlRegex.test(paths[path])) {
						baseUrlArr = [paths[path]];
					} else {
						pathArr = paths[path].split('/');

						for (var i = 0, length = pathArr.length; i < length; i++) {
							if (pathArr[i] == '..') {
								baseUrlArr.pop();
							} else {
								baseUrlArr.push(pathArr[i]);
							}
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

		create: function(define) {
			console.debug('Creating plugin for loading css');

			define('css', utils.bind(function() {
				return {
					load: utils.bind(function(name, req, onload, options) {
						console.debug('Received css load exec for', name);

						var url = this.nameToUrl(name, options) + '.css',
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

define('requirejs-sandbox/plugins/transit', function(transits) {
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

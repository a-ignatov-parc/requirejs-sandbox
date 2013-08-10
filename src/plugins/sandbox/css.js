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

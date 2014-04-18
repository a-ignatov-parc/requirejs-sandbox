define('requirejs-css', function() {
	console.debug('Creating plugin for loading css');

	var extensionRegex = /\.css$/,
		pluginHandler = function() {
			return {
				load: function(name, req, onload) {
					// Обрабатываем `id` модуля чтоб оно всегда ссылалось на правильный файл.
					name = name.replace(extensionRegex, '') + '.css';

					console.debug('Received css load exec for', name);

					var url = req.toUrl(name),
						link = window.document.createElement('link'),
						hasStyleSheet = 'sheet' in link,
						loadHandler = function() {
							// Вызываем колбек о завершении загрузки.
							if (!cssHasLoaded) {
								onload({
									cssNode: link,
									append: function() {
										return appendStyleNode(this.cssNode);
									},
									remove: function() {
										return removeStyleNode(this.cssNode);
									}
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

					// Вставляем тег со стилями в тег `head`.
					appendStyleNode(link);

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
				}
			};
		};

	function appendStyleNode(node) {
		if (node) {
			if (node.parentNode) {
				removeStyleNode(node);
			}
			document.getElementsByTagName('head')[0].appendChild(node);
		}
		return node;
	}

	function removeStyleNode(node) {
		if (node && node.parentNode && typeof(node.parentNode.removeChild) === 'function') {
			node.parentNode.removeChild(node);
		}
		return node;
	}

	return {
		name: 'css',
		handler: pluginHandler
	};
});

// Регистрируем основной плагин.
require(['requirejs-css'], function(requirejsCss) {
	define(requirejsCss.name, requirejsCss.handler);
});

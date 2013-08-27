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

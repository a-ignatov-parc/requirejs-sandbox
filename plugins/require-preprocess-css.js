define('requirejs-preprocess-css', [
	'requirejs-sandbox/helpers/utils',
	'requirejs-sandbox/helpers/preprocess/abstract',
	'requirejs-sandbox/helpers/processor/core',
	'requirejs-sandbox/helpers/processor/prefix'
], function(utils, preprocessAbstract, ProcessorCore, prefixMixin) {
	console.debug('Creating plugin for loading css with code preprocessing');

	var ProcessorConstructor = new ProcessorCore(),
		module = utils.extend({}, preprocessAbstract, {
			Processor: ProcessorConstructor
		});

	// Расширяем базовый функционал миксинами.
	ProcessorConstructor.extend(prefixMixin, {
		resolve: function(callback) {
			var sourceCode = this._responseSourceCache[this.id],
				styleNode = document.createElement('style');

			// Добавялем стилевой ноде необходимые свойства.
			styleNode.media = 'all';
			styleNode.type = 'text/css';

			// Пытаемся определить поддерживается ли свойство `styleSheet`.
			// Если да, то это IE и вставка стилей делаем по другому механизму.
			if (styleNode.styleSheet != null && styleNode.styleSheet.cssText != null) {
				styleNode.styleSheet.cssText = sourceCode;
			} else {
				styleNode.appendChild(document.createTextNode(sourceCode));
			}

			// Вставляем ноду в секцию head страницы.
			document.getElementsByTagName('head')[0].appendChild(styleNode);

			if (typeof(callback) === 'function') {
				callback(styleNode);
			}
		}
	});

	return {
		name: 'preprocess-css',
		handler: function() {
			return {
				load: function(name, req, onload) {
					var loader;

					console.debug('Received css load exec for', name);

					if (module.checkXMLHttpRequestSupport()) {
						loader = module.createAjaxLoader(name, req, onload, '.css');
						loader.load();
					} else {
						require(['css!' + name], function() {
							onload({
								status: 2
							});
						});
					}
				}
			};
		}
	};
});

// Регистрируем основной плагин.
require(['requirejs-preprocess-css'], function(requirejsCss) {
	define(requirejsCss.name, requirejsCss.handler);
});

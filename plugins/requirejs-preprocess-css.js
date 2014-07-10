define([
	'helpers/utils',
	'helpers/preprocess/abstract',
	'helpers/processor/core',
	'helpers/processor/prefix'
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
			appendStyleNode(styleNode);

			// Отрабатываем колбек возвращая api такой же как и в случае с `require-css`.
			// 
			// [INFO] `require-css` и `requirejs-preprocess-css` должны быть идентичны по 
			// возвращаемым api.
			if (typeof(callback) === 'function') {
				callback({
					cssNode: styleNode,
					append: function() {
						return appendStyleNode(this.cssNode);
					},
					remove: function() {
						return removeStyleNode(this.cssNode);
					}
				});
			}
		}
	});

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
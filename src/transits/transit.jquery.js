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

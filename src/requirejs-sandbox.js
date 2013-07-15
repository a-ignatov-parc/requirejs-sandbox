define(['underscore'], function(_) {
	var createdSandboxes = {},
		Sandbox = function(options) {
			// Создаем объект параметром на основе дефолтных значений и значений переданных при 
			// инициализации.
			this.options = _.extend({
				baseUrl: null,
				useLocationFix: false
			}, options);

			// Создаем свойства класса.
			this.iframe = null;
			this.sandbox = null;

			this.createSandbox(function(sandbox) {
				console.log('Sandbox created!', sandbox, sandbox.document.body);

				this.createLoader();
			});

			return {
				name: this.options.name,
				iframe: this.iframe,
				sandbox: this.sandbox,
				destroy: function() {
					delete this.sandbox;
					this.iframe.parentNode.removeChild(this.iframe);
					delete this.iframe;
				}
			};
		};

	Sandbox.prototype = {
		createSandbox: function(callback) {
			var onLoadHandler = this.bind(function(event) {
					// Получаем и сохраняем ссылку на объект `window` в созданом `sandbox`
					this.sandbox = this.iframe.contentWindow;

					// Добавляем пустой элемент `script` в `body` `iframe` для правильной работы загрузчика
					this.sandbox.document.body.appendChild(document.createElement('script'));

					if (typeof(callback) === 'function') {
						callback.call(this, this.sandbox);
					}
				}, this);

			this.iframe = document.createElement('iframe');
			this.iframe.style.display = 'none';

			// Из-за особенностей работы некоторых приложений и браузеров с `window.location` в 
			// странице `about:blank` создаваемой с помощью урла `javascript:0` может не работать 
			// какой-то функционал. Для исправления этого функционала добавлен параметр 
			// `options.useLocationFix`, который исправит работу приложений с адресной строкой, но 
			// не позволит встраивать приложение в страницу работающую на другом домене из-за 
			// кроссдоменных ограничений. 
			// 
			// В принципе это не страшно, так как давать виджету влиять на урл приложения это не 
			// лудший вариант.
			if (this.options.useLocationFix) {
				this.iframe.src = this.options.hosts.html + 'sandbox.html';
				console.warn('Using location fix hack for ' + this.appName + '! No crossdomain initialization available');
			} else {
				this.iframe.src = 'javascript:0';
			}
			this.iframe.tabIndex = -1;

			// Навешиваем обработчик на событие полной отрисовки _iframe_ и всего его содержимого
			if (this.iframe.addEventListener) { 
				this.iframe.addEventListener('load', onLoadHandler, false);
			} else if (this.iframe.attachEvent) { 
				this.iframe.attachEvent('onload', onLoadHandler);
			} else { 
				this.iframe.onload = onLoadHandler;
			}

			if (document.readyState === 'complete') {
				document.body.appendChild(this.iframe);
			} else {
				throw 'Can\'t determine DOMReady state!';
			}
		},

		createLoader: function() {
			console.log('Creating loader inside sandbox');
		},

		bind: function(fn, context) {
			context || (context = window);

			if (typeof(fn) === 'function') {
				return function() {
					return fn.apply(context, arguments);
				}
			}
			return fn;
		}
	};

	console.log('module arguments', arguments);

	return {
		get: function(name) {
			if (createdSandboxes[name]) {
				return createdSandboxes[name];
			}
		},
		set: function(name, params) {
			var sandbox;

			if (typeof(name) === 'string' && typeof(params) === 'object') {
				if (sandbox = this.get(name)) {
					console.warn('Sandbox with name: ' + name + ' already exist! Returning existed sandbox.', sandbox);
					return sandbox;
				}
				return createdSandboxes[name] = new Sandbox(name, params);
			}
		},
		destroy: function(name) {
			var sandbox = this.get(name);

			if (sandbox) {
				sandbox.destroy();
			}
		}
	};
});

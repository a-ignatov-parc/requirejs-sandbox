define([
	'console',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
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
						// Так как вся библиотека компилируется с помощью almond.js, мо мы без 
						// проблем можем получить `sandbox-manager` таким простым и синхронным 
						// путем. 
						// Он уже точно будет зарезолвлен.
						sandboxContructor = require('sandbox-manager')._getSandboxInternalInterface();
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

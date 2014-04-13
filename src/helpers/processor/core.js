define([
	'logger/logger',
	'helpers/utils'
], function(console, utils) {
	var moduleCheckRegex = /^\s*define\((['"][^'"]+['"])?,?\s*(?:\[([^\]]+)\])?,?\s*(function[^]+)\);*\s*$/;

	return function(context) {
		var target = context || window,
			Processor = function(success, sourceCode) {
				// Указываем уникальный `id` препроцессора.
				this.id = this._responseSourceCache.push(sourceCode || '') - 1;

				// Определяем текущий статус препроцессора.
				// Список возможных статусов:
				// 
				// * `0` – Препроцессор создан успешно и загруженный ресурс может быть 
				//         правильно обрабатан.
				// 
				// * `1` – Препроцессор создан успешно, но запрашиваемый ресурс не удалось 
				//         загрузить.
				// 
				// * `2` – Браузер не поддерживает XMLHttpRequest с поддержкой CORS, 
				//         а следовательно загрузка файла производилась в режиме фоллбека 
				//         и препроцессинг файла не доступен.
				// 
				// * `3` – Запрашиваемый файл небыл найден.
				// 
				// * `4` – Запрашиваемый файл был загружен с необрабатываемым HTTP статусом.
				// 
				// * `5` – При загрузке запрашиваемого файла произошла ошибка.
				// 
				// * `6` – Неизвестный статус.
				if (typeof(success) === 'boolean' || success === 1 || success === 0 || success === '1' || success === '0') {
					if (typeof(success) === 'boolean') {
						this.status = +!success;
					} else {
						this.status = +success;
					}
					console.debug('Creating extended resource api with status: ' + this.status);
				} else {
					console.debug('Creating simple response with status: ' + success);
					return {
						id: this.id,
						status: success || 6
					};
				}
			};

		Processor.extend = function() {
			for (var i = 0, length = arguments.length; i < length; i++) {
				utils.extend(Processor.prototype, arguments[i]);
			}
		};

		Processor.prototype = {
			_responseSourceCache: [],
			replace: function(pattern, replace) {
				console.debug('[replace] Executing replace with pattern: "' + pattern + '" and replace: "' + replace + '"');
				this._responseSourceCache[this.id] = this._responseSourceCache[this.id].replace(pattern, replace);
				console.debug('[replace] Executing result: ', this._responseSourceCache[this.id]);
				return this;
			},
			resolve: function(callback) {
				var sourceCode = this._responseSourceCache[this.id],
					moduleParts = moduleCheckRegex.exec(sourceCode),
					resolvingResult,
					moduleResolver,
					evaledCode;

				console.debug('Execution context', target);

				if (moduleParts) {
					console.debug('module name: "' + moduleParts[1] + '"');
					console.debug('module deps: "' + moduleParts[2] + '"');
					console.debug('module handler: "' + moduleParts[3] + '"');

					evaledCode = new target.Function('return ' + moduleParts[3]);
					try {
						moduleResolver = evaledCode();
					} catch(e) {
						console.error(e);
					}

					if (moduleParts[2]) {
						var depsString = moduleParts[2].replace(/['"]*\s*/g, ''),
							deps = depsString.split(',');

						console.debug('Dependencies resolved to: [' + deps.join(', ') + ']');

						target.require(deps, function() {
							try {
								resolvingResult = moduleResolver.apply(this, arguments);
							} catch(e) {
								console.error(e);
							}

							if (typeof(callback) === 'function') {
								callback(resolvingResult);
							}
						});
					} else {
						try {
							resolvingResult = moduleResolver();
						} catch(e) {
							console.error(e);
						}

						if (typeof(callback) === 'function') {
							callback(resolvingResult);
						}
					}
				} else {
					evaledCode = new target.Function(sourceCode);
					try {
						resolvingResult = evaledCode();
					} catch(e) {
						console.error(e);
					}

					if (typeof(callback) === 'function') {
						callback(resolvingResult);
					}
				}
				return this;
			}
		};
		return Processor;
	};
});

define([
	'logger/logger',
	'helpers/utils'
], function(console, utils) {
	var sourceCache = [],
		moduleCheckRegex = /^\s*define\((['"][^'"]+['"])?,?\s*(?:\[([^\]]+)\])?,?\s*(function[^]+)\);*\s*$/,
		moduleTrimRegex = /['"]*\s*/g;

	return function(context) {
		var target = context || window,
			Processor = function(success, sourceCode) {
				// Указываем уникальный `id` препроцессора.
				this.id = this._responseSourceCache.push(sourceCode || '') - 1;

				// Записываем ссылку на `target`, на случай если он кому-то из миксинов может 
				// понадобиться.
				this.target = target;

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
			_responseSourceCache: sourceCache,

			replace: function(pattern, replace) {
				console.debug('[replace] Executing replace with pattern: "' + pattern + '" and replace: "' + replace + '"');
				this._responseSourceCache[this.id] = this._responseSourceCache[this.id].replace(pattern, replace);
				console.debug('[replace] Executing result: ' + this._responseSourceCache[this.id]);
				return this;
			},

			resolve: function(callback) {
				var sourceCode = this._responseSourceCache[this.id],
					moduleParts = moduleCheckRegex.exec(sourceCode),
					resolvingResult,
					moduleResolver,
					evaledCode,
					name,
					deps;

				console.debug('Execution context', target);

				if (moduleParts) {
					if (moduleParts[1]) {
						name = moduleParts[1].replace(moduleTrimRegex, '');
					}

					if (moduleParts[2]) {
						deps = moduleParts[2]
							.replace(moduleTrimRegex, '')
							.split(',');
					} else {
						deps = [];
					}

					console.debug('module name: "' + name + '"');
					console.debug('module deps: [' + deps.join(', ') + ']');
					console.debug('module handler: "' + moduleParts[3] + '"');

					evaledCode = new target.Function('return ' + moduleParts[3]);

					try {
						moduleResolver = evaledCode();
					} catch(e) {
						console.error(e);
					}

					if (name) {
						target.define(name, deps, function() {
							try {
								resolvingResult = moduleResolver.apply(this, arguments);
							} catch(e) {
								console.error(e);
							}
							return resolvingResult;
						});

						target.require([name], function(moduleResult) {
							if (typeof(callback) === 'function') {
								callback(moduleResult);
							}
						});
					} else if (deps.length) {
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

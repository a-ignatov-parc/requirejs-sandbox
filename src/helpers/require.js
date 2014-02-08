define([
	'logger/logger',
	'helpers/utils',
	'helpers/resolvers/optionsResolver',
	'helpers/resolvers/scriptResolver',
	'helpers/resolvers/iframeResolver',
	'helpers/resolvers/cdnResolver'
], function(console, utils, optionsResolver, scriptResolver, iframeResolver, cdnResolver) {
	var resolvedUrl = false,
		resolveQueueIndex = 0,
		resolveQueue = [optionsResolver, scriptResolver, iframeResolver, cdnResolver],
		handlersQueue = [],
		inProgress = false;

	function success(value) {
		utils.each(handlersQueue, function(args) {
			if (typeof(args[0]) === 'function') {
				args[0](value);
			} else {
				error('No fail handler', args[1] || false);
			}
		});

		// Так как мы завершили поиску url, то выставляем флаг в неактивное состояние.
		inProgress = false;
		handlersQueue.length = resolveQueueIndex = 0;
	}

	function error(msg, handler) {
		if (handler != null) {
			if (typeof(handler) === 'function') {
				handler(msg);
			} else {
				throw msg;
			}
		} else {
			utils.each(handlersQueue, function(args) {
				error(msg, args[1] || false);
			});

			// Так как мы завершили поиску url, то выставляем флаг в неактивное состояние.
			inProgress = false;
			handlersQueue.length = resolveQueueIndex = 0;
		}
	}

	return {
		id: 'main',

		resolved: function() {
			return !!resolvedUrl;
		},

		reset: function() {
			resolvedUrl = false;
			utils.each(resolveQueue, function(resolver) {
				resolver.reset();
			});
		},

		resolve: function() {
			var _this = this,
				args;

			// Чтоб небыло проблем с несколькими запросами на резолв урла мы помещаем все запросы 
			// в очередь и запускаем один процесс резолвинга. Как только попытка резуолвинга 
			// закончилась, не важно успешно или нет, мы для всех элементов очереди сообщаем 
			// результаты.
			// 
			// В аргументах должны передаваться следующие значения:
			// `arguments[0]` – onResolveHandler
			// `arguments[1]` – onFailHandler
			// `arguments[2]` – options
			if (arguments.length) {
				handlersQueue.push(args = arguments);
			} else if (handlersQueue.length) {
				args = handlersQueue[0];
			} else {
				console.error('No handlers passed');
				return;
			}

			// Если резолвинг уже в процессе, то выходим из метода, так как хендлеры уже все равно
			// добавленны в очередь на обработку.
			if (inProgress && arguments.length) {
				return;
			}

			// Выставляем флаг о том что процесс резолвинга начался.
			inProgress = true;

			// Проверяем, если url уже зарезолвен, то сразу же выдаем результат без запуска 
			// очередного этапа поиска.
			// Если же урл еще не найден, то запускаем механизм поиска.
			if (this.resolved()) {
				console.debug(this.id + ' resolver: already resolved as', resolvedUrl);
				success(resolvedUrl);
				return resolvedUrl;
			} else if (resolveQueue[resolveQueueIndex] != null) {
				console.debug(this.id + ' resolver: starting "' + resolveQueue[resolveQueueIndex].id + '" resolver');

				resolveQueue[resolveQueueIndex].resolve(function(url) {
					success(resolvedUrl = url);
				}, function() {
					resolveQueueIndex++;
					_this.resolve();
				}, args[2]);
			} else {
				console.debug(this.id + ' resolver: all resolvers failed');
				error('Unable to resolve require.js source url');
			}
		}
	};
});

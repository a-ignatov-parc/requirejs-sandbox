define([
	'logger/logger',
	'helpers/resolvers/optionsResolver',
	'helpers/resolvers/scriptResolver',
	'helpers/resolvers/iframeResolver',
	'helpers/resolvers/cdnResolver'
], function(console, optionsResolver, scriptResolver, iframeResolver, cdnResolver) {
	var resolvedUrl = false,
		resolveQueueIndex = 0,
		resolveQueue = [optionsResolver, scriptResolver, iframeResolver, cdnResolver];

	function success(value, handler) {
		if (typeof(handler) === 'function') {
			handler(value);
			return true;
		}
		return false;
	}

	function error(msg, handler) {
		if (typeof(handler) === 'function') {
			handler(msg);
		} else {
			throw msg;
		}
	}

	return {
		id: 'main',

		resolved: function() {
			return !!resolvedUrl;
		},

		resolve: function(options, onResolveHandler, onFailHandler) {
			var _this = this;

			if (this.resolved()) {
				console.debug(this.id + ' resolver: already resolved as', resolvedUrl);

				if (!success(resolvedUrl, onResolveHandler)) {
					error('No fail handler', onFailHandler);
				}
				return resolvedUrl;
			} else if (resolveQueue[resolveQueueIndex] != null) {
				console.debug(this.id + ' resolver: starting "' + resolveQueue[resolveQueueIndex].id + '" resolver');

				resolveQueue[resolveQueueIndex].resolve(options, function(url) {
					if (!success(resolvedUrl = url, onResolveHandler)) {
						error('No fail handler', onFailHandler);
					}
				}, function() {
					resolveQueueIndex++;
					_this.resolve(options, onResolveHandler, onFailHandler);
				});
			} else {
				console.debug(this.id + ' resolver: all resolvers failed');

				resolveQueueIndex = 0;
				error('Unable to resolve require.js source url', onFailHandler);
			}
		}
	};
});

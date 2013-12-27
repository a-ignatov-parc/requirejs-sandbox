define([
	'logger/logger',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	return utils.defaults({
		id: 'options',
		resolve: function(options, onResolveHandler, onFailHandler) {
			if (this.state() == this.STATE_IDLE) {
				console.debug(this.id + ' resolver: starting resolving');

				if (options && typeof(options.requireUrl) === 'string') {
					this._resolvedUrl = options.requireUrl;
					this._state = this.STATE_RESOLVED;
				}
			}
			return this._hanldleResolver(onResolveHandler, onFailHandler);
		}
	}, abstract);
});

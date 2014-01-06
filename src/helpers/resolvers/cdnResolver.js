define([
	'logger/logger',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	return utils.defaults({
		id: 'cdn',
		_resolvedUrl: '//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.9/require.min.js',
		resolve: function(onResolve) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve);
				console.debug(this.id + ' resolver: starting resolving');
				this._state = this.STATE_RESOLVED;
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

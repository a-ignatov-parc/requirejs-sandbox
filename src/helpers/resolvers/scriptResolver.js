define([
	'console',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	var regex = /require(?:[.-]min)?.js$/;

	return utils.defaults({
		id: 'script',

		_checkUrl: function(url) {
			return regex.test(url);
		},

		resolve: function(onResolve, onFail) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				console.debug(this.id + ' resolver: starting resolving');

				utils.each(this._getScripts(), utils.bind(function(scriptNode) {
					if (this._checkUrl(scriptNode.getAttribute('src'))) {
						this._resolvedUrl = scriptNode.getAttribute('src');
						this._state = this.STATE_RESOLVED;
						return true;
					}
				}, this));
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

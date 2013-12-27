define([
	'logger/logger',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	return utils.defaults({
		id: 'cdn',
		_state: abstract.STATE_RESOLVED,
		_resolvedUrl: '//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.9/require.min.js',
		resolve: function(options, onResolveHandler, onFailHandler) {
			console.debug(this.id + ' resolver: starting resolving');
			return this._hanldleResolver(onResolveHandler, onFailHandler);
		}
	}, abstract);
});

define([
	'logger/logger',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	return utils.defaults({
		id: 'iframe',
		resolve: function(options, onResolveHandler, onFailHandler) {
			// var scripts = utils.scripts();

			if (this.state() == this.STATE_IDLE) {
				console.debug(this.id + ' resolver: starting resolving');
			}
			return this._hanldleResolver(onResolveHandler, onFailHandler);
		}
	}, abstract);
});

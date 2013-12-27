/* jshint -W015 */
define([
	'logger/logger'
], function(console) {
	return {
		STATE_IDLE: 'idle',

		STATE_RESOLVING: 'resolving',

		STATE_RESOLVED: 'resolved',

		_state: 'idle',
		_resolvedUrl: false,

		_hanldleResolver: function(onResolveHandler, onFailHandler) {
			switch (this.state()) {
				case this.STATE_RESOLVED:
					console.debug(this.id + ' resolver: resolved', this._resolvedUrl);

					if (typeof(onResolveHandler) === 'function') {
						onResolveHandler(this._resolvedUrl);
					}
					return this._resolvedUrl;
				case this.STATE_IDLE:
					console.debug(this.id + ' resolver: failed to resolve');

					if (typeof(onResolveHandler) === 'function') {
						onFailHandler();
					}
					return;
				default:
					return;
			}
		},

		state: function() {
			return this._state;
		},

		resolve: function() {
			console.error('Not implemented!');
		}
	};
});

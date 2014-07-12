/* jshint -W015 */
define([
	'console',
	'helpers/utils'
], function(console, utils) {
	var abstractObj = {
			STATE_IDLE: 'idle',
			STATE_RESOLVING: 'resolving',
			STATE_RESOLVED: 'resolved',

			_state: null,
			_resolvedUrl: false,

			_onSuccess: function() {
				console.warn('No success handler defined for ' + this.id + ' resolver! Use _setHandlers() method to do this.');
			},

			_onFail: function() {
				console.warn('No fail handler defined for ' + this.id + ' resolver! Use _setHandlers() method to do this.');
			},

			_setHandlers: function(onResolve, onFail) {
				if (typeof(onResolve) === 'function') {
					this._onSuccess = onResolve;
				}
				if (typeof(onFail) === 'function') {
					this._onFail = onFail;
				}
			},

			_hanldleResolver: function() {
				switch (this.state()) {
					case this.STATE_RESOLVED:
						console.debug(this.id + ' resolver: resolved', this._resolvedUrl);
						this._onSuccess(this._resolvedUrl);
						return this._resolvedUrl;
					case this.STATE_IDLE:
						console.debug(this.id + ' resolver: failed to resolve');
						this._onFail();
						return;
					default:
						return;
				}
			},

			_getScripts: function() {
				return utils.scripts();
			},

			state: function() {
				return this._state;
			},

			resolve: function() {
				console.error('Not implemented!');
			},

			reset: function() {
				this._state = this.STATE_IDLE;
				return this;
			}
		};

	return abstractObj.reset();
});

define([
	'logger/logger',
	'helpers/utils'
], function(console, utils) {
	var defaults = {
			_options: {},

			name: 'default',

			shimName: 'default',

			// Метод инициализации патча.
			enable: function() {
				console.warn('Method is not implemented');
			},

			disable: function() {
				console.warn('Method is not implemented');
			},

			setOptions: function(options) {
				var Wrapper = function(options) {
						this._options = utils.extend({}, this._options, options);
					};

				Wrapper.prototype = this;
				return new Wrapper(options);
			}
		};

	return {
		init: function(obj) {
			return utils.defaults(obj, defaults);
		}
	};
});

define([
	'logger/logger'
], function(console) {
	return {
		autoFix: function(customPropList) {
			var propertyList = [
					'location',
					'document',
					'getComputedStyle',
					'addEventListener',
					'removeEventListener',
					'attachEvent',
					'detachEvent'
				].concat(customPropList || []),
				processedProps = {};

			for (var i = 0, length = propertyList.length; i < length; i++) {
				var targetProp = propertyList[i]
						.split('.')
						.pop(),
					prop = '__window_' + targetProp.toLowerCase();

				if (!processedProps[propertyList[i]]) {
					processedProps[propertyList[i]] = true;
					this.target[prop] = this.target.sandboxApi && this.target.sandboxApi.parentWindow[targetProp] || this.target[targetProp];
					this._responseSourceCache[this.id] = this._responseSourceCache[this.id]
						.replace(targetProp, prop)
						.replace('window.' + targetProp, prop);
				}
			}
			console.debug('[autoFix] Executing result: ' + this._responseSourceCache[this.id]);
			return this;
		}
	};
});

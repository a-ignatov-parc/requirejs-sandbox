define([
	'logger/logger'
], function(console) {
	return {
		autoFix: function(customPropList) {
			var fixedSourceCode = ';',
				propertyList = [
					'location',
					'document',
					'getComputedStyle',
					'addEventListener',
					'removeEventListener',
					'attachEvent',
					'detachEvent'
				].concat(customPropList || []),
				originalSourceCode = this._responseSourceCache[this.id];

			for (var i = 0, length = propertyList.length; i < length; i++) {
				var targetProp = propertyList[i]
						.split('.')
						.pop(),
					prop = '__window_' + targetProp.toLowerCase();

				fixedSourceCode += 'var ' + targetProp + ' = ' + prop + ';';
				this.target[prop] = this.target.sandboxApi && this.target.sandboxApi.parentWindow[targetProp] || this.target[targetProp];
				originalSourceCode = originalSourceCode.replace('window.' + targetProp, prop);
			}
			this._responseSourceCache[this.id] = fixedSourceCode + originalSourceCode;

			console.debug('[autoFix] Executing result: ' + this._responseSourceCache[this.id]);

			return this;
		}
	};
});

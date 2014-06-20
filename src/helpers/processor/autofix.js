define(function() {
	return {
		autoFix: function() {
			var propertyList = ['location', 'document'],
				fixedSourceCode = ';',
				originalSourceCode = this._responseSourceCache[this.id];

			for (var i = 0, length = propertyList.length; i < length; i++) {
				fixedSourceCode += 'var ' + propertyList[i] + ' = window.sandboxApi && window.sandboxApi.parentWindow.' + propertyList[i] + ' || window.' + propertyList[i] + ';'
				originalSourceCode.replace('window.' + propertyList[i], propertyList[i]);
			}
			this._responseSourceCache[this.id] = fixedSourceCode + originalSourceCode;
			return this;
		}
	};
});

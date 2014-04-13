define(function() {
	return {
		autoWrap: function() {
			this._responseSourceCache[this.id] = ';with(window.sandboxApi.windowProxy || window) {;' + this._responseSourceCache[this.id] + ';};';
			return this;
		}
	};
});

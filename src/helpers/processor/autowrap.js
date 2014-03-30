define(function() {
	return {
		autoWrap: function() {
			this.responseSourceCache[this.id] = ';with(window.sandboxApi.windowProxy || window) {;' + this.responseSourceCache[this.id] + ';};';
			return this;
		}
	};
});

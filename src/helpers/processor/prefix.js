define(function() {
	var selectorsRegex = /\s+/g;

	return {
		prefix: function() {
			this.responseSourceCache[this.id] = this.responseSourceCache[this.id].replace(selectorsRegex, '');
			return this;
		}
	};
});

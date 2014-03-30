define([
	'logger/logger'
], function(console) {
	var selectorsRegex = /([},]\s*)([^@][.#[*]?[^,{]+)/g;

	return {
		prefix: function(selector) {
			this.responseSourceCache[this.id] = ('}' + this.responseSourceCache[this.id]).replace(selectorsRegex, '$1' + selector + ' $2');
			this.responseSourceCache[this.id] = this.responseSourceCache[this.id].substr(1);
			console.debug('[prefix] Executing result for selector "' + selector + '": ', this.responseSourceCache[this.id]);
			return this;
		}
	};
});

define([
	'logger/logger'
], function(console) {
	// Регулярное выражение для поиска селекторов и разбивание на группы для последующего 
	// проставления префикса.
	// 
	// Найденные проблемы:
	// 1. Не заменяются селекторы body и html на селектор префикса.
	// 2. Нет явного исключения селекторов "@xxx"
	var selectorsRegex = /(^|\s+|}\s*)([*.#\w\d\s-:\[\]\(\)="]+)(,|{[^}]+})/g;

	return {
		prefix: function(selector) {
			// Удаляем все коментарии из кода, они все равно только мешаются.
			this.responseSourceCache[this.id] = this.responseSourceCache[this.id].replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '');

			// Проставляем префикс у селекторов.
			this.responseSourceCache[this.id] = this.responseSourceCache[this.id].replace(selectorsRegex, '$1' + selector + ' $2$3');
			console.debug('[prefix] Executing result for selector "' + selector + '": ', this.responseSourceCache[this.id]);
			return this;
		}
	};
});

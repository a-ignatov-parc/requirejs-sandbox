define([
	'logger/logger'
], function(console) {
	// Регулярное выражение для поиска селекторов и разбивание на группы для последующего 
	// проставления префикса.
	var selectorsRegex = /(^|\s+|}\s*)([@*.#\w\d\s-:\[\]\(\)="']+)(,|{[^}]+})/g,
		commentsRegex = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g;

	return {
		prefix: function(selector) {
			// Так как префикс проставляется абсолютно всему у чего имеется следующая 
			// кострукция `aaa, bbb {}` для полного и правильного проставления префиксов 
			// операция разбивается на несколько шагов:
			// 
			// 1. Удаляем коментарии из исходного кода. Для работы стилей это не важно, но сильно 
			//    поможет избежать проблем с неправильным срабатыванием префиксера.
			// 2. Проставляем префиксы.
			// 3. Обрабатываем кейс когда у at-селекторов не может быть никаких префиксов. 
			//    Более подробно об этом описано тут: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face
			// 4. Так как считается что элемент с префикс-селектором у нас будет корневым 
			//    элементом, то все селекторы на html и body заменяем на селектор префикса.
			this.responseSourceCache[this.id] = this.responseSourceCache[this.id]
				.replace(commentsRegex, '')
				.replace(selectorsRegex, '$1' + selector + ' $2$3')
				.replace(new RegExp(selector + '\\s(@(charset|document|font-face|import|keyframes|media|page|supports))', 'g'), '$1')
				.replace(new RegExp('(' + selector + ')\\s(html|body)', 'g'), '$1');

			console.debug('[prefix] Executing result for selector "' + selector + '": ', this.responseSourceCache[this.id]);

			return this;
		}
	};
});

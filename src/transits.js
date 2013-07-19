define('transits', ['transit.jquery'], function() {
	var transits = {};

	// Создаем справочник транзитов
	for (var i = 0, length = arguments.length; i < length; i++) {
		if (arguments[i] != null) {
			transits[arguments[i].name] = arguments[i];
		}
	}
	return transits;
});

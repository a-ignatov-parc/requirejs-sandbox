define('requirejs-sandbox/patches', [
	'requirejs-sandbox/patches/jquery'
], function() {
	var patches = {};

	// Создаем справочник патчей
	for (var i = 0, length = arguments.length; i < length; i++) {
		if (arguments[i] != null) {
			patches[arguments[i].name] = arguments[i];
		}
	}
	return patches;
});

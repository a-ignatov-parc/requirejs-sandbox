define('requirejs-sandbox/plugins/transit', [
	'requirejs-sandbox/transits',
	'requirejs-sandbox/logger'
], function(transits, console) {
	return {
		create: function(define, sandbox) {
			console.debug('Creating plugin for loading transits');

			define('transit', function() {
				return {
					load: function (name, req, onload) {
						console.debug('Received module load exec for', name);

						// Загружаем модуль и если транзит для этого модуля существует, то делаем 
						// патч.
						req([name], function(module) {
							// Если транзит для данного модуля существует, то инициализируем его.
							if (transits[name]) {
								try {
									transits[name].enable(window, sandbox, module);
								} catch(e) {
									console.error(e);
								}
							}

							// После инициализации транзита, если он был найден, вызываем 
							// обработчик `require.js` `onload`, который обозначает завершение 
							// работ плугина.
							onload(module);
						});
					}
				};
			});
		}
	};
});

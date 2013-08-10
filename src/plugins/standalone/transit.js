define('requirejs-sandbox/plugins/transit', function(transits) {
	return {
		create: function(define) {
			define('transit', function() {
				return {
					load: function (name, req, onload) {
						req([name], function(module) {
							onload(module);
						});
					}
				};
			});
		}
	};
});

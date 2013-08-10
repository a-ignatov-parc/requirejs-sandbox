define('requirejs-sandbox/plugins/transit', function() {
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

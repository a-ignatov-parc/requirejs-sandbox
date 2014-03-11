define([
	'logger/logger',
	'helpers/utils'
], function(console, utils) {
	console.debug('Creating plugin for loading and preprocessing resources');

	var pluginHandler = function() {
			return {
				load: function(name, req, onload) {
					var request;

					console.debug('Received resource load exec for', name);

					if (typeof(XMLHttpRequest) === 'function') {
						request = new XMLHttpRequest();
						request.open("GET", req.toUrl(name), true);
						request.
					} else {
						console.log(123, 'Need to do somthing here');
					}
					// onload({

					// });
				}
			};
		};

	return {
		name: 'preprocess',
		handler: pluginHandler
	};
});

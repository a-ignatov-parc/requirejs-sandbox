define([
	'logger/logger'
], function(console) {
	return {
		Processor: null,
		loadHandler: function(name, onload) {
			var Processor = this.Processor;

			return function() {
				switch(this.status) {
					case 0: // Successful HTTP status in PhantomJS
					case 200:
					case 302:
						console.debug('File received correctly', name);
						onload(new Processor(true, this.response));
						break;
					case 404:
						console.debug('File was not found', name);
						onload(new Processor(3));
						break;
					default:
						console.debug('Received unhandled status', name, this.status);
						onload(new Processor(4));
				}
			};
		},
		errorHandler: function(name, onload) {
			var Processor = this.Processor;

			return function() {
				console.debug('Something goes wrong', name, this.status);
				onload(new Processor(5));
			};
		},
		checkXMLHttpRequestSupport: function() {
			return typeof(XMLHttpRequest) === 'function' || typeof(XMLHttpRequest) === 'object';
		},
		createAjaxLoader: function(name, req, onload, extension) {
			var request = new XMLHttpRequest();

			request.open('GET', req.toUrl(name) + (extension || '.js'), true);
			request.onload = this.loadHandler(name, onload);
			request.onerror = this.errorHandler(name, onload);
			return {
				load: function() {
					request.send();
				}
			};
		},
		createDefaultLoader: function(name, req, onload) {
			var Processor = this.Processor;

			return {
				load: function() {
					req([name], function() {
						onload(new Processor(2));
					});
				}
			};
		}
	};
});

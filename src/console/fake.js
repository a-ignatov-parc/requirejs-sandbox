define(function() {
	var namespace = 'logger';

	return {
		setLogLevel: function() {},
		setNamespace: function(ns) {
			namespace = ns;
		},
		log: function() {},
		debug: function() {},
		info: function() {},
		warn: function() {
			console.warn.apply(console, arguments);
		},
		error: function() {
			console.error.apply(console, arguments);
		},
		off: function() {}
	};
});

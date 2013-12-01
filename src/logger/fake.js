define(function() {
	var namespace = 'logger';

	return {
		setLogLevel: function() {},
		setNamespace: function(ns) {
			namespace = ns;
		},
		debug: function() {},
		info: function() {},
		warn: function() {
			var args = Array.prototype.slice.call(arguments);

			args.unshift(namespace);
			console.warn.apply(this, arguments);
		},
		error: function() {
			var args = Array.prototype.slice.call(arguments);

			args.unshift(namespace);
			console.error.apply(this, arguments);
		},
		off: function() {}
	};
});

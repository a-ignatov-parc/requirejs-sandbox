require([
	'requirejs-sandbox/plugins/css',
	'requirejs-sandbox/plugins/transit'
], function(cssPlugin, transitPlugin) {
	cssPlugin.create(window.define);
	transitPlugin.create(window.define);
	return true;
});

require([
	'requirejs-sandbox/plugins/css'
], function(cssPlugin) {
	cssPlugin.create(window.define);
	return true;
});

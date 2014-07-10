(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('<%= moduleName %>', [], factory);
	} else {
		root.requirejsSandbox || (root.requirejsSandbox = {});
		root.requirejsSandbox<% if (typeof(globalNamespace) !== 'undefined') { %>['<%= globalNamespace %>']<% } %>['<%= globalName %>'] = factory();
	}
}(this, function () {

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('<%= moduleName %>', [], factory);
	} else {
		root.requirejsSandbox || (root.requirejsSandbox = {});
		root.requirejsSandbox.<%= globalName %> = factory();
	}
}(this, function () {

	return require('<%= exportName %>');
}));
<% if (typeof(exportPlugin) !== 'undefined' && exportPlugin) { %>
	if (typeof define === 'function' && define.amd) {
		require(['<%= moduleName %>'], function(plugin) {
			define(plugin.name, [], plugin.handler);
		});
	}
<% } %>
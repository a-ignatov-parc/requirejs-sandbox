	<% if (typeof(exportPlugin) !== 'undefined' && exportPlugin) { %>
		if (typeof window.define === 'function' && window.define.amd) {
			require(['<%= exportName %>'], function(plugin) {
				window.define(plugin.name, plugin.handler);
			});
		}
	<% } %>
	return require('<%= exportName %>');
}));

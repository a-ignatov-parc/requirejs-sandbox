define(['jquery', 'backbone'], function($, Backbone) {
	return Backbone.View.extend({
		events: {},

		initialize: function() {
			console.log('workspace view is initialized in', window, window.document.body);
		}
	});
});

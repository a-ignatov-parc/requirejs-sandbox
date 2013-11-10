define(['jquery', 'backbone', 'css!styles/app'], function($, Backbone, appStyles) {
	return Backbone.View.extend({
		events: {},

		initialize: function() {
			console.log('workspace view is initialized in', window, window.document.body);
			console.log('Searching for DOM element with class "b-content"', $('.b-content'));

			this.render();
		},

		render: function() {
			$('body').append('<div class="b-workspace">app</div>');
		}
	});
});

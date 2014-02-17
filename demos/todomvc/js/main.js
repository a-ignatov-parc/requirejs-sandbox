/*global require*/
require.config({
	baseUrl: 'js/apps/angular',
	paths: {
		angular: '../../../bower_components/angular/angular'
	},
	shim: {
		angular: {
			exports: 'angular'
		}
	}
});

require([
	'requirejs-sandbox',
	'requirejs-sandbox/patches/jquery',
	'angular',
	'app',
	'controllers/todo',
	'directives/todoFocus'
], function (requrejsSandbox, jqueryPatch, angular) {
	angular.bootstrap(document, ['todomvc']);

	requrejsSandbox.set('TodoMVC', {
		requireConfig: {
			baseUrl: 'js/apps/backbone',
			paths: {
				jquery: '../../../bower_components/jquery/jquery',
				underscore: '../../../bower_components/underscore/underscore',
				backbone: '../../../bower_components/backbone/backbone',
				backboneLocalstorage: '../../../bower_components/backbone.localStorage/backbone.localStorage',
				text: '../../../bower_components/requirejs-text/text'
			},
			shim: {
				underscore: {
					exports: '_'
				},
				backbone: {
					deps: [
						'underscore',
						'jquery'
					],
					exports: 'Backbone'
				},
				backboneLocalstorage: {
					deps: ['backbone'],
					exports: 'Store'
				}
			}
		},
		patch: [jqueryPatch.setOptions({
			rootEl: document.getElementById('backbone')
		})],
		success: function(require) {
			require([
				'backbone',
				'views/app',
				'routers/router'
			], function (Backbone, AppView, Workspace) {
				// Initialize routing and start Backbone.history()
				new Workspace();
				Backbone.history.start();

				// Initialize the application view
				new AppView();
			});
		}
	});
});

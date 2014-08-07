/*global require*/
require.config({
	baseUrl: 'js/apps/angular',
	paths: {
		angular: '../../../../../bower_components/angular/angular'
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
	'requirejs-sandbox/helpers/patch',
	'angular',
	'app',
	'controllers/todo',
	'directives/todoFocus'
], function (requirejsSandbox, jqueryPatch, patchAbstract, angular, angularApp) {
	// Конфигурируем приложение чтоб оно работало не через pushState, а через hashchange.
	angularApp.config(['$provide', function($provide) {
		$provide.decorator('$sniffer', function($delegate) {
			$delegate.history = false;
			return $delegate;
		});
	}]);

	// Запускаем приложение.
	angular.bootstrap(document, ['todomvc']);

	requirejsSandbox.set('TodoMVC', {
		requireConfig: {
			baseUrl: 'js/apps/backbone',
			paths: {
				jquery: '../../../../../bower_components/jquery/jquery',
				backbone: '../../../../../bower_components/backbone/backbone',
				underscore: '../../../../../bower_components/underscore/underscore',
				backboneLocalstorage: '../../../../../bower_components/backbone.localStorage/backbone.localStorage',
				text: '../../../../../bower_components/requirejs-text/text'
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
		}), patchAbstract.init({
			name: 'backbone',

			shimName: 'Backbone',

			enable: function(window, sandbox, Backbone) {
				Backbone.history.location = window.location;
				Backbone.history.history = window.history;
			}
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

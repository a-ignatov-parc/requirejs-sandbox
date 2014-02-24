// Конфигурируем require
require.config({
	baseUrl: 'app',
	paths: {
		'css': '../../../static/styles/css',
		'jquery': '../../../bower_components/jquery/jquery',
		'backbone': '../../../bower_components/backbone/backbone',
		'underscore': '../../../bower_components/underscore/underscore'
	},
	shim: {
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		}
	}
});

// Пытаемся загрузить в песочницу вью и инициализировать ее.
require(['views/workspace'], function(Workspace) {
	var workspace = new Workspace;
});

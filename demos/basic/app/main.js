// Конфигурируем require
require.config({
	baseUrl: 'app',
	paths: {
		'css': '../../../static/styles/css',
		'backbone': '../../../static/js/libs/backbone',
		'jquery': '../../../static/js/libs/jquery/jquery.min',
		'underscore': '../../../static/js/libs/underscore.min'
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

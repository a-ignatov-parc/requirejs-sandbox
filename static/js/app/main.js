// Конфигурируем require
require.config({
	baseUrl: '../static/js/app',
	paths: {
		'backbone': '../libs/backbone',
		'jquery': '../libs/jquery/jquery.min',
		'underscore': '../libs/underscore.min'
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

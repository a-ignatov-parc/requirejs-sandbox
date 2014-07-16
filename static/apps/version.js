requirejs(['requirejs-sandbox', 'requirejs-css', 'requirejs-sandbox/patches/jquery'], function(requirejsSandbox, requirejsCss, jqueryPatch) {
	requirejsSandbox.set('VersionWidget', {
		requireConfig: {
			paths: {
				'css': '../../static/styles/css',
				'jquery': '../../bower_components/jquery/jquery'
			}
		},
		patch: ['jquery'],
		plugins: [requirejsCss],
		success: function(require) {
			// Пытаемся загрузить в песочницу вью и инициализировать ее.
			require(['jquery', 'css!css/label'], function($, styles) {
				var label = $('<div>')
						.addClass('b-label b-label__version')
						.text('Loading...')
						.appendTo('body');

				$.getJSON('../../package.json', function(data) {
					label
						.text('requirejs-sandbox version: v' + data.version)
						.addClass('b-label-info');
				});
			});
		}
	});
});
define([
	'logger/logger',
	'helpers/utils',
	'helpers/preprocess/abstract',
	'helpers/processor/core',
	'helpers/processor/autowrap',
	'helpers/processor/prefix'
], function(console, utils, preprocessAbstract, ProcessorCore, autowrapMixin) {
	console.debug('Creating plugin for loading and preprocessing resources');

	return function(context) {
		var ProcessorConstructor = new ProcessorCore(context),
			module = utils.extend({}, preprocessAbstract, {
				Processor: ProcessorConstructor
			});

		// Расширяем базовый функционал миксинами.
		ProcessorConstructor.extend(autowrapMixin);

		return {
			name: 'preprocess',
			handler: function() {
				return {
					load: function(name, req, onload) {
						var loader;

						console.debug('Received resource load exec for', name);

						if (module.checkXMLHttpRequestSupport()) {
							loader = module.createAjaxLoader(name, req, onload);
						} else {
							loader = module.createDefaultLoader(name, req, onload);
						}
						loader.load();
					}
				};
			}
		};
	};
});

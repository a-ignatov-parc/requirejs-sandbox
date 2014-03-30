define([
	'logger/logger',
	'helpers/utils'
], function(console, utils) {
	var moduleCheckRegex = /^\s*define\((['"][^'"]+['"])?,?\s*(?:\[([^\]]+)\])?,?\s*(function[^]+)\);*\s*$/;

	return function(context) {
		var target = context || window,
			Processor = function(success, sourceCode) {
				if (typeof(success) === 'boolean' || success === 1 || success === 0 || success === '1' || success === '0') {
					if (typeof(success) === 'boolean') {
						this.status = +!success;
					} else {
						this.status = +success;
					}
					this.id = this.responseSourceCache.push(sourceCode || '') - 1;
					console.debug('Creating extended resource api with status: ' + this.status);
				} else {
					console.debug('Creating simple response with status: ' + success);
					return {
						status: success
					};
				}
			};

		Processor.extend = function() {
			for (var i = 0, length = arguments.length; i < length; i++) {
				utils.extend(Processor.prototype, arguments[i]);
			}
		};

		Processor.prototype = {
			responseSourceCache: [],
			replace: function(pattern, replace) {
				console.debug('[replace] Executing replace with pattern: "' + pattern + '" and replace: "' + replace + '"');
				this.responseSourceCache[this.id] = this.responseSourceCache[this.id].replace(pattern, replace);
				console.debug('[replace] Executing result: ', this.responseSourceCache[this.id]);
				return this;
			},
			resolve: function(callback) {
				var sourceCode = this.responseSourceCache[this.id],
					moduleParts = moduleCheckRegex.exec(sourceCode),
					resolvingResult,
					moduleResolver,
					evaledCode;

				console.debug('Execution context', target);

				if (moduleParts) {
					console.debug('module name: "' + moduleParts[1] + '"');
					console.debug('module deps: "' + moduleParts[2] + '"');
					console.debug('module handler: "' + moduleParts[3] + '"');

					evaledCode = new target.Function('return ' + moduleParts[3]);
					try {
						moduleResolver = evaledCode();
					} catch(e) {
						console.error(e);
					}

					if (moduleParts[2]) {
						var depsString = moduleParts[2].replace(/['"]*\s*/g, ''),
							deps = depsString.split(',');

						console.debug('Dependencies resolved to: [' + deps.join(', ') + ']');

						target.require(deps, function() {
							try {
								resolvingResult = moduleResolver.apply(this, arguments);
							} catch(e) {
								console.error(e);
							}

							if (typeof(callback) === 'function') {
								callback(resolvingResult);
							}
						});
					} else {
						try {
							resolvingResult = moduleResolver();
						} catch(e) {
							console.error(e);
						}

						if (typeof(callback) === 'function') {
							callback(resolvingResult);
						}
					}
				} else {
					evaledCode = new target.Function(sourceCode);
					try {
						resolvingResult = evaledCode();
					} catch(e) {
						console.error(e);
					}

					if (typeof(callback) === 'function') {
						callback(resolvingResult);
					}
				}
				return this;
			}
		};
		return Processor;
	};
});

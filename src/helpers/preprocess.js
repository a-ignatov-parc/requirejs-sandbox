define([
	'logger/logger',
	'helpers/utils'
], function(console, utils) {
	console.debug('Creating plugin for loading and preprocessing resources');

	var Response = function(success, sourceCode) {
			if (typeof(success) === 'boolean' || success == 1 || success == 0) {
				if (typeof(success) === 'boolean') {
					this.status = +!success;
				} else {
					this.status = +success;
				}
				this.id = responseSourceCache.push(sourceCode || '') - 1;
				console.debug('Creating extended resource api with status: ' + this.status);
			} else {
				console.debug('Creating simple response with status: ' + success);
				return {
					status: success
				}
			}
		},
		pluginHandler = function() {
			return {
				load: function(name, req, onload) {
					var loadHandler = function() {
							switch(this.status) {
								case 200:
								case 302:
									console.debug('File received correctly', name);
									onload(new Response(true, this.response));
									break;
								case 404:
									console.debug('File was not found', name);
									onload(new Response());
									break;
								default:
									console.debug('Received unhandled status', name, this.status);
									onload(new Response());
							}
						},
						errorHandler = function() {
							console.debug('Something goes wrong', name, this.status);
							onload(new Response());
						},
						request;

					console.debug('Received resource load exec for', name);

					if (typeof(XMLHttpRequest) === 'function') {
						request = new XMLHttpRequest();
						request.open('GET', req.toUrl(name) + '.js', true);
						request.onload = loadHandler;
						request.onerror = errorHandler;
						request.send();
					} else {
						console.log(123, 'Need to do somthing here');

						// Mayby this?
						// Пытаемся загрузить стандартными средствами.
						req([name], function(result) {
							onload({
								status: 2
							});
						});
					}
				}
			};
		},
		responseSourceCache = [],
		moduleCheckRegex = /^\s*define\((['"][^'"]+['"])?,?\s*(?:\[([^\]]+)\])?,?\s*(function[^]+)\);*\s*$/,
		target;

	Response.prototype = {
		replace: function(pattern, replace) {
			console.debug('Executing replace with pattern: "' + pattern + '" and replace: "' + replace + '"');
			responseSourceCache[this.id] = responseSourceCache[this.id].replace(pattern, replace);
			console.debug('Executing result: ', responseSourceCache[this.id]);
			return this;
		},
		resolve: function(callback) {
			var sourceCode = responseSourceCache[this.id],
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
		},
		autoWrap: function() {
			responseSourceCache[this.id] = ';with(window.sandboxApi.windowProxy || window) {;' + responseSourceCache[this.id] + ';};';
			return this;
		}
	};

	return {
		name: 'preprocess',
		handler: pluginHandler,
		setContext: function(context) {
			target = context || window;
		}
	};
});

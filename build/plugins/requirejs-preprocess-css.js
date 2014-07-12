(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('requirejs-preprocess-css', [], factory);
	} else {
		root.requirejsSandbox || (root.requirejsSandbox = {});
		root.requirejsSandbox['plugins']['requirejs-preprocess-css'] = factory();
	}
}(this, function () {
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../bower_components/almond/almond", function(){});

/* jshint -W089 */
define('helpers/utils',[],function() {
	var ArrayProto = Array.prototype,
		ObjProto = Object.prototype,
		hasOwnProperty = ObjProto.hasOwnProperty,
		nativeForEach = ArrayProto.forEach,
		slice = ArrayProto.slice,
		breaker = {},
		link = document.createElement('a');

	return {
		// Метод `has` позаимствованный из `underscore.js`
		has: function(obj, key) {
			return hasOwnProperty.call(obj, key);
		},

		// Метод `each` позаимствованный из `underscore.js`
		each: function(obj, iterator, context) {
			if (obj == null) {
				return;
			}

			if (nativeForEach && obj.forEach === nativeForEach) {
				obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
				for (var i = 0, l = obj.length; i < l; i++) {
					if (iterator.call(context, obj[i], i, obj) === breaker) {
						return;
					}
				}
			} else {
				for (var key in obj) {
					if (this.has(obj, key)) {
						if (iterator.call(context, obj[key], key, obj) === breaker) {
							return;
						}
					}
				}
			}
		},

		// Метод `extend` позаимствованный из `underscore.js`
		extend: function(obj) {
			this.each(slice.call(arguments, 1), function(source) {
				if (source) {
					for (var prop in source) {
						obj[prop] = source[prop];
					}
				}
			});
			return obj;
		},

		bind: function(fn, context) {
			context || (context = window);

			if (typeof(fn) === 'function') {
				return function() {
					return fn.apply(context, arguments);
				};
			}
			return fn;
		},

		defaults: function(obj) {
			this.each(slice.call(arguments, 1), function(source) {
				if (source) {
					for (var prop in source) {
						if (obj[prop] === void 0) {
							obj[prop] = source[prop];
						}
					}
				}
			});
			return obj;
		},

		scripts: function() {
			return Array.prototype.slice.call(document.getElementsByTagName('script'), 0);
		},

		urlToLocation: function(url) {
			link.href = url;

			return {
				href: link.href,
				host: link.host,
				port: link.port,
				hash: link.hash,
				origin: link.origin,
				search: link.search,
				protocol: link.protocol,
				hostname: link.hostname,
				pathname: link.pathname
			};
		}
	};
});

define('console',[],function() {
	var Logger = function() {
		var levels = {
				debug: 1,
				info: 2,
				warn: 4,
				error: 8,
				off: 100
			},
			logLevel = levels.warn,
			namespace = 'logger',
			console = {
				log: function() {},
				info: function() {},
				warn: function() {},
				error: function() {}
			};

		// для корректной работы в ie9
		if (Function.prototype.bind && window.console && typeof window.console.log === 'object') {
			['log', 'info', 'warn', 'error'].forEach(function(method) {
				console[method] = this.bind(window.console[method], window.console);
			}, Function.prototype.call);
		} else if (window.console) {
			console = window.console;
		}

		var log = function(data, level) {
			data = Array.prototype.slice.call(data);

			if (level >= logLevel) {
				var hdlr = console.log,
					prefix = '[' + namespace + ']';

				if (level === levels.warn && console.warn) {
					hdlr = console.warn;
					prefix += '[warn]';
				} else if (level === levels.error && console.error) {
					hdlr = console.error;
					prefix += '[ERR]';
				} else if (level === levels.info && console.info) {
					hdlr = console.info;
				}
				data.unshift(prefix);
				hdlr.apply(console, data);
			}
		};

		return {
			setLogLevel: function(level) {
				if (!levels[level]) {
					throw 'unknown log level: ' + level;
				}
				logLevel = levels[level];
			},
			setNamespace: function(ns) {
				namespace = ns;
			},
			log: function() {
				this.debug.apply(this, arguments);
			},
			debug: function() {
				log(arguments, levels.debug);
			},
			info: function() {
				log(arguments, levels.info);
			},
			warn: function() {
				log(arguments, levels.warn);
			},
			error: function() {
				log(arguments, levels.error);
			},
			off: function() {
				logLevel = levels.OFF;
			}
		};
	};
	return new Logger();
});

define('helpers/preprocess/abstract',[
	'console'
], function(console) {
	return {
		Processor: null,

		loadHandler: function(name, onload) {
			var Processor = this.Processor;

			return function() {
				switch(this.status) {
					case 0: // Successful HTTP status in PhantomJS
					case 200:
					case 302:
						console.debug('File received correctly', name);
						onload(new Processor(true, this.response));
						break;
					case 404:
						console.debug('File was not found', name);
						onload(new Processor(3));
						break;
					default:
						console.debug('Received unhandled status', name, this.status);
						onload(new Processor(4));
				}
			};
		},

		errorHandler: function(name, onload) {
			var Processor = this.Processor;

			return function() {
				console.debug('Something goes wrong', name, this.status);
				onload(new Processor(5));
			};
		},

		checkXMLHttpRequestSupport: function() {
			return typeof(XMLHttpRequest) === 'function' || typeof(XMLHttpRequest) === 'object';
		},

		createAjaxLoader: function(name, req, onload, extension) {
			var request = new XMLHttpRequest();

			request.open('GET', req.toUrl(name) + (extension || '.js'), true);
			request.onload = this.loadHandler(name, onload);
			request.onerror = this.errorHandler(name, onload);
			return {
				load: function() {
					request.send();
				}
			};
		},

		createDefaultLoader: function(name, req, onload) {
			var Processor = this.Processor;

			return {
				load: function() {
					req([name], function() {
						onload(new Processor(2));
					});
				}
			};
		}
	};
});

define('helpers/processor/core',[
	'console',
	'helpers/utils'
], function(console, utils) {
	var sourceCache = [],
		moduleCheckRegex = /^\s*define\((['"][^'"]+['"])?,?\s*(?:\[([^\]]+)\])?,?\s*(function[^]+)\);*\s*$/,
		moduleTrimRegex = /['"]*\s*/g;

	return function(context) {
		var target = context || window,
			Processor = function(success, sourceCode) {
				// Указываем уникальный `id` препроцессора.
				this.id = this._responseSourceCache.push(sourceCode || '') - 1;

				// Записываем ссылку на `target`, на случай если он кому-то из миксинов может 
				// понадобиться.
				this.target = target;

				// Определяем текущий статус препроцессора.
				// Список возможных статусов:
				// 
				// * `0` – Препроцессор создан успешно и загруженный ресурс может быть 
				//         правильно обрабатан.
				// 
				// * `1` – Препроцессор создан успешно, но запрашиваемый ресурс не удалось 
				//         загрузить.
				// 
				// * `2` – Браузер не поддерживает XMLHttpRequest с поддержкой CORS, 
				//         а следовательно загрузка файла производилась в режиме фоллбека 
				//         и препроцессинг файла не доступен.
				// 
				// * `3` – Запрашиваемый файл небыл найден.
				// 
				// * `4` – Запрашиваемый файл был загружен с необрабатываемым HTTP статусом.
				// 
				// * `5` – При загрузке запрашиваемого файла произошла ошибка.
				// 
				// * `6` – Неизвестный статус.
				if (typeof(success) === 'boolean' || success === 1 || success === 0 || success === '1' || success === '0') {
					if (typeof(success) === 'boolean') {
						this.status = +!success;
					} else {
						this.status = +success;
					}
					console.debug('Creating extended resource api with status: ' + this.status);
				} else {
					console.debug('Creating simple response with status: ' + success);
					return {
						id: this.id,
						status: success || 6
					};
				}
			};

		Processor.extend = function() {
			for (var i = 0, length = arguments.length; i < length; i++) {
				utils.extend(Processor.prototype, arguments[i]);
			}
		};

		Processor.prototype = {
			_responseSourceCache: sourceCache,

			replace: function(pattern, replace) {
				console.debug('[replace] Executing replace with pattern: "' + pattern + '" and replace: "' + replace + '"');

				this._responseSourceCache[this.id] = this._responseSourceCache[this.id].replace(pattern, replace);

				console.debug('[replace] Executing result: ' + this._responseSourceCache[this.id]);

				return this;
			},

			resolve: function(callback) {
				var sourceCode = this._responseSourceCache[this.id],
					moduleParts = moduleCheckRegex.exec(sourceCode),
					resolvingResult,
					moduleResolver,
					evaledCode,
					name,
					deps;

				console.debug('Execution context', target);

				if (moduleParts) {
					if (moduleParts[1]) {
						name = moduleParts[1].replace(moduleTrimRegex, '');
					}

					if (moduleParts[2]) {
						deps = moduleParts[2]
							.replace(moduleTrimRegex, '')
							.split(',');
					} else {
						deps = [];
					}

					console.debug('module name: "' + name + '"');
					console.debug('module deps: [' + deps.join(', ') + ']');
					console.debug('module handler: "' + moduleParts[3] + '"');

					evaledCode = new target.Function('return ' + moduleParts[3]);

					try {
						moduleResolver = evaledCode();
					} catch(e) {
						console.error(e);
					}

					if (name) {
						target.define(name, deps, function() {
							try {
								resolvingResult = moduleResolver.apply(this, arguments);
							} catch(e) {
								console.error(e);
							}
							return resolvingResult;
						});

						target.require([name], function(moduleResult) {
							if (typeof(callback) === 'function') {
								callback(moduleResult);
							}
						});
					} else if (deps.length) {
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
					var scriptNode = target.document.createElement('script');

					scriptNode.type = 'text/javascript';
					scriptNode.text = sourceCode;
					target.document.getElementsByTagName('head')[0].appendChild(scriptNode);

					if (typeof(callback) === 'function') {
						callback();
					}
				}
				return this;
			}
		};
		return Processor;
	};
});

define('helpers/processor/prefix',[
	'console'
], function(console) {
	// Регулярное выражение для поиска селекторов и разбивание на группы для последующего 
	// проставления префикса.
	var selectorsRegex = /(^\s*|}\s*|\s*)([@*.#\w\d\s-:\[\]\(\)="']+)(,|{[^}]+})/g,
		commentsRegex = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g; // http://ostermiller.org/findcomment.html

	return {
		prefix: function(selector) {
			var prefixRegex = new RegExp(selector + '\\s', 'g');

			// Так как префикс проставляется абсолютно всему у чего имеется следующая 
			// кострукция `aaa[, bbb] {}` для полного и правильного проставления префиксов 
			// операция разбивается на несколько шагов:
			// 
			// 1. Удаляем коментарии из исходного кода. Для работы стилей это не важно, но сильно 
			//    поможет избежать проблем с неправильным срабатыванием префиксера.
			// 2. Проставляем префиксы.
			// 3. Обрабатываем кейс, когда у at-селекторов не может быть никаких префиксов. 
			//    Более подробно об этом описано тут: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face
			// 4. Обрабатываем кейс, когда первая регулярка могла заменить путь 
			//    в конструкции `url()` востанавливая его в первоначальное значение.
			// 5. Так как считается что элемент с префикс-селектором у нас будет корневым 
			//    элементом, то все селекторы на html и body заменяем на селектор префикса.
			this._responseSourceCache[this.id] = this._responseSourceCache[this.id]
				.replace(commentsRegex, '')
				.replace(selectorsRegex, '$1' + selector + ' $2$3')
				.replace(new RegExp(selector + '\\s(@(charset|document|font-face|import|keyframes|media|page|supports))', 'g'), '$1')
				.replace(/url\([^)]+\)/g, function(match) {
					return match.replace(prefixRegex, '');
				})
				.replace(new RegExp('(' + selector + ')\\s(html|body)', 'g'), '$1');

			console.debug('[prefix] Executing result for selector "' + selector + '": ', this._responseSourceCache[this.id]);

			return this;
		}
	};
});

define('plugins/requirejs-preprocess-css',[
	'helpers/utils',
	'helpers/preprocess/abstract',
	'helpers/processor/core',
	'helpers/processor/prefix'
], function(utils, preprocessAbstract, ProcessorCore, prefixMixin) {
	console.debug('Creating plugin for loading css with code preprocessing');

	var ProcessorConstructor = new ProcessorCore(),
		module = utils.extend({}, preprocessAbstract, {
			Processor: ProcessorConstructor
		});

	// Расширяем базовый функционал миксинами.
	ProcessorConstructor.extend(prefixMixin, {
		resolve: function(callback) {
			var sourceCode = this._responseSourceCache[this.id],
				styleNode = document.createElement('style');

			// Добавялем стилевой ноде необходимые свойства.
			styleNode.media = 'all';
			styleNode.type = 'text/css';

			// Пытаемся определить поддерживается ли свойство `styleSheet`.
			// Если да, то это IE и вставка стилей делаем по другому механизму.
			if (styleNode.styleSheet != null && styleNode.styleSheet.cssText != null) {
				styleNode.styleSheet.cssText = sourceCode;
			} else {
				styleNode.appendChild(document.createTextNode(sourceCode));
			}

			// Вставляем ноду в секцию head страницы.
			appendStyleNode(styleNode);

			// Отрабатываем колбек возвращая api такой же как и в случае с `require-css`.
			// 
			// [INFO] `require-css` и `requirejs-preprocess-css` должны быть идентичны по 
			// возвращаемым api.
			if (typeof(callback) === 'function') {
				callback({
					cssNode: styleNode,
					append: function() {
						return appendStyleNode(this.cssNode);
					},
					remove: function() {
						return removeStyleNode(this.cssNode);
					}
				});
			}
		}
	});

	function appendStyleNode(node) {
		if (node) {
			if (node.parentNode) {
				removeStyleNode(node);
			}
			document.getElementsByTagName('head')[0].appendChild(node);
		}
		return node;
	}

	function removeStyleNode(node) {
		if (node && node.parentNode && typeof(node.parentNode.removeChild) === 'function') {
			node.parentNode.removeChild(node);
		}
		return node;
	}

	return {
		name: 'preprocess-css',
		handler: function() {
			return {
				load: function(name, req, onload) {
					var loader;

					console.debug('Received css load exec for', name);

					if (module.checkXMLHttpRequestSupport()) {
						loader = module.createAjaxLoader(name, req, onload, '.css');
						loader.load();
					} else {
						require(['css!' + name], function() {
							onload({
								status: 2
							});
						});
					}
				}
			};
		}
	};
});
	return require('plugins/requirejs-preprocess-css');
}));

	if (typeof define === 'function' && define.amd) {
		require(['requirejs-preprocess-css'], function(plugin) {
			define(plugin.name, [], plugin.handler);
		});
	}

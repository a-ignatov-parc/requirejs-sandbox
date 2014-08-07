/**
 * requirejs-sandbox - v0.6.2-5 (build date: 08/08/2014)
 * https://github.com/a-ignatov-parc/requirejs-sandbox
 * Sandbox manager for require.js allows user to run multiple apps without scope intersection issues
 * Copyright (c) 2014 Anton Ignatov
 * Licensed MIT
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('requirejs-sandbox', [], factory);
	} else {
		root.requirejsSandbox || (root.requirejsSandbox = {});
		root.requirejsSandbox['manager'] = factory();
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

/* jshint -W015 */
define('helpers/resolvers/abstract',[
	'console',
	'helpers/utils'
], function(console, utils) {
	var abstractObj = {
			STATE_IDLE: 'idle',
			STATE_RESOLVING: 'resolving',
			STATE_RESOLVED: 'resolved',

			_state: null,
			_resolvedUrl: false,

			_onSuccess: function() {
				console.warn('No success handler defined for ' + this.id + ' resolver! Use _setHandlers() method to do this.');
			},

			_onFail: function() {
				console.warn('No fail handler defined for ' + this.id + ' resolver! Use _setHandlers() method to do this.');
			},

			_setHandlers: function(onResolve, onFail) {
				if (typeof(onResolve) === 'function') {
					this._onSuccess = onResolve;
				}
				if (typeof(onFail) === 'function') {
					this._onFail = onFail;
				}
			},

			_hanldleResolver: function() {
				switch (this.state()) {
					case this.STATE_RESOLVED:
						console.debug(this.id + ' resolver: resolved', this._resolvedUrl);
						this._onSuccess(this._resolvedUrl);
						return this._resolvedUrl;
					case this.STATE_IDLE:
						console.debug(this.id + ' resolver: failed to resolve');
						this._onFail();
						return;
					default:
						return;
				}
			},

			_getScripts: function() {
				return utils.scripts();
			},

			state: function() {
				return this._state;
			},

			resolve: function() {
				console.error('Not implemented!');
			},

			reset: function() {
				this._state = this.STATE_IDLE;
				return this;
			}
		};

	return abstractObj.reset();
});

define('helpers/resolvers/optionsResolver',[
	'console',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	return utils.defaults({
		id: 'options',

		resolve: function(onResolve, onFail, options) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				console.debug(this.id + ' resolver: starting resolving');

				if (options && typeof(options.requireUrl) === 'string') {
					this._resolvedUrl = options.requireUrl;
					this._state = this.STATE_RESOLVED;
				}
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

define('helpers/resolvers/scriptResolver',[
	'console',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	var regex = /require(?:[.-]min)?.js$/;

	return utils.defaults({
		id: 'script',

		_checkUrl: function(url) {
			return regex.test(url);
		},

		resolve: function(onResolve, onFail) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				console.debug(this.id + ' resolver: starting resolving');

				utils.each(this._getScripts(), utils.bind(function(scriptNode) {
					if (this._checkUrl(scriptNode.getAttribute('src'))) {
						this._resolvedUrl = scriptNode.getAttribute('src');
						this._state = this.STATE_RESOLVED;
						return true;
					}
				}, this));
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

define('helpers/resolvers/iframeResolver',[
	'console',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	var sandboxContructor;

	function checkScript(scripts, sandbox, createScript, callback) {
		if (scripts.length) {
			createScript(sandbox, scripts.shift().getAttribute('src'), function(script) {
				if (typeof(sandbox.require) === 'function' && typeof(sandbox.requirejs) === 'function' && typeof(sandbox.define) === 'function') {
					callback(script.getAttribute('src'));
				} else {
					checkScript(scripts, sandbox, createScript, callback);
				}
			}, function() {
				checkScript(scripts, sandbox, createScript, callback);
			});
		} else {
			callback(false);
		}
	}

	return utils.defaults({
		id: 'iframe',

		resolve: function(onResolve, onFail) {
			var scripts;

			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve, onFail);

				// Получаем список скриптов которые в дальнейшем будем проверять.
				scripts = this._getScripts();

				console.debug(this.id + ' resolver: starting resolving');

				if (scripts.length) {
					this._state = this.STATE_RESOLVING;

					if (!sandboxContructor) {
						// Так как вся библиотека компилируется с помощью almond.js, мо мы без 
						// проблем можем получить `sandbox-manager` таким простым и синхронным 
						// путем. 
						// Он уже точно будет зарезолвлен.
						sandboxContructor = require('sandbox-manager')._getSandboxInternalInterface();
					}

					// Создаем песочницу для поиска require.js среди скриптов загруженных на 
					// странице.
					sandboxContructor.createFrame(null, utils.bind(function(iframe) {
						var sandbox = iframe.contentWindow;

						// Во избежания отображения не нужных ошибок в консоль во время проверки 
						// переопределяем в посочнице метод `onerror`.
						sandbox.onerror = function() {};

						// Начинаем проверку всех доступных скриптов на странице в поисках 
						// require.js
						checkScript(scripts, sandbox, sandboxContructor.createScript, utils.bind(function(url) {
							if (url) {
								this._resolvedUrl = url;
								this._state = this.STATE_RESOLVED;
							} else {
								this._state = this.STATE_IDLE;
							}

							// После завершения всех проверок удаляем проверочную песочницу за ее 
							// ненадобностью.
							iframe.parentNode.removeChild(iframe);
							iframe = sandbox = scripts = null;

							// Вызываем хендлеры в зависимости от текущего состояния.
							this._hanldleResolver();
						}, this));
					}, this));
				}
			} else if (this.state() == this.STATE_RESOLVED) {
				return this._resolvedUrl;
			}
		}
	}, abstract);
});

define('helpers/resolvers/cdnResolver',[
	'console',
	'helpers/utils',
	'helpers/resolvers/abstract'
], function(console, utils, abstract) {
	return utils.defaults({
		id: 'cdn',

		_resolvedUrl: '//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.9/require.min.js',

		resolve: function(onResolve) {
			if (this.state() == this.STATE_IDLE) {
				// Регистрируем хендлеры.
				this._setHandlers(onResolve);
				console.debug(this.id + ' resolver: starting resolving');
				this._state = this.STATE_RESOLVED;
			}
			return this._hanldleResolver();
		}
	}, abstract);
});

define('helpers/require',[
	'console',
	'helpers/utils',
	'helpers/resolvers/optionsResolver',
	'helpers/resolvers/scriptResolver',
	'helpers/resolvers/iframeResolver',
	'helpers/resolvers/cdnResolver'
], function(console, utils, optionsResolver, scriptResolver, iframeResolver, cdnResolver) {
	var resolvedUrl = false,
		resolveQueueIndex = 0,
		resolveQueue = [optionsResolver, scriptResolver, iframeResolver, cdnResolver],
		handlersQueue = [],
		inProgress = false;

	function success(value) {
		utils.each(handlersQueue, function(args) {
			if (typeof(args[0]) === 'function') {
				args[0](value);
			} else {
				error('No fail handler', args[1] || false);
			}
		});

		// Так как мы завершили поиску url, то выставляем флаг в неактивное состояние.
		inProgress = false;
		handlersQueue.length = resolveQueueIndex = 0;
	}

	function error(msg, handler) {
		if (handler != null) {
			if (typeof(handler) === 'function') {
				handler(msg);
			} else {
				throw msg;
			}
		} else {
			utils.each(handlersQueue, function(args) {
				error(msg, args[1] || false);
			});

			// Так как мы завершили поиску url, то выставляем флаг в неактивное состояние.
			inProgress = false;
			handlersQueue.length = resolveQueueIndex = 0;
		}
	}

	return {
		id: 'main',

		resolved: function() {
			return !!resolvedUrl;
		},

		reset: function() {
			resolvedUrl = false;
			utils.each(resolveQueue, function(resolver) {
				resolver.reset();
			});
		},

		resolve: function() {
			var _this = this,
				args;

			// Чтоб небыло проблем с несколькими запросами на резолв урла мы помещаем все запросы 
			// в очередь и запускаем один процесс резолвинга. Как только попытка резуолвинга 
			// закончилась, не важно успешно или нет, мы для всех элементов очереди сообщаем 
			// результаты.
			// 
			// В аргументах должны передаваться следующие значения:
			// `arguments[0]` – onResolveHandler
			// `arguments[1]` – onFailHandler
			// `arguments[2]` – options
			if (arguments.length) {
				handlersQueue.push(args = arguments);
			} else if (handlersQueue.length) {
				args = handlersQueue[0];
			} else {
				console.error('No handlers passed');
				return;
			}

			// Если резолвинг уже в процессе, то выходим из метода, так как хендлеры уже все равно
			// добавленны в очередь на обработку.
			if (inProgress && arguments.length) {
				return;
			}

			// Выставляем флаг о том что процесс резолвинга начался.
			inProgress = true;

			// Проверяем, если url уже зарезолвен, то сразу же выдаем результат без запуска 
			// очередного этапа поиска.
			// Если же урл еще не найден, то запускаем механизм поиска.
			if (this.resolved()) {
				console.debug(this.id + ' resolver: already resolved as', resolvedUrl);
				success(resolvedUrl);
				return resolvedUrl;
			} else if (resolveQueue[resolveQueueIndex] != null) {
				console.debug(this.id + ' resolver: starting "' + resolveQueue[resolveQueueIndex].id + '" resolver');

				resolveQueue[resolveQueueIndex].resolve(function(url) {
					success(resolvedUrl = url);
				}, function() {
					resolveQueueIndex++;
					_this.resolve();
				}, args[2]);
			} else {
				console.debug(this.id + ' resolver: all resolvers failed');
				error('Unable to resolve require.js source url');
			}
		}
	};
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

define('helpers/processor/autofix',[
	'console'
], function(console) {
	return {
		autoFix: function(customPropList) {
			var propertyList = [
					'location',
					'document'
				].concat(customPropList || []),
				processedProps = {};

			for (var i = 0, length = propertyList.length; i < length; i++) {
				var targetProp = propertyList[i]
						.split('.')
						.pop(),
					prop = '__window_' + targetProp.toLowerCase();

				if (!processedProps[propertyList[i]]) {
					processedProps[propertyList[i]] = true;
					this.target[prop] = this.target.sandboxApi && this.target.sandboxApi.parentWindow[targetProp] || this.target[targetProp];
					this._responseSourceCache[this.id] = this._responseSourceCache[this.id].replace(new RegExp('(\\W)' + targetProp + '(\\W)', 'g'), '$1' + prop + '$2');
				}
			}
			console.debug('[autoFix] Executing result: ' + this._responseSourceCache[this.id]);
			return this;
		}
	};
});

define('helpers/preprocess/plugin',[
	'console',
	'helpers/utils',
	'helpers/preprocess/abstract',
	'helpers/processor/core',
	'helpers/processor/autofix'
], function(console, utils, preprocessAbstract, ProcessorCore, autofixMixin) {
	console.debug('Creating plugin for loading and preprocessing resources');

	return function(context) {
		var ProcessorConstructor = new ProcessorCore(context),
			module = utils.extend({}, preprocessAbstract, {
				Processor: ProcessorConstructor
			});

		// Расширяем базовый функционал миксинами.
		ProcessorConstructor.extend(autofixMixin);

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

define('sandbox-manager',[
	'console',
	'helpers/utils',
	'helpers/require',
	'helpers/preprocess/plugin'
], function(console, utils, requireResolver, PreprocessPlugin) {
	var createdSandboxes = {},
		Sandbox = function(options) {
			// Создаем объект параметром на основе дефолтных значений и значений переданных при 
			// инициализации.
			this.options = utils.defaults(options, {
				debug: false,
				requireUrl: null,
				requireMain: null,
				requireConfig: {},
				sandboxLinks: {},
				patch: [],
				plugins: [],
				success: function() {},
				error: function() {}
			});

			// Создаем свойства класса.
			this.iframe = null;
			this.sandbox = null;
			this.requireUrl = null;

			// Создаем api объект песочницы.
			// С песочницей со статусом больше 0 дальнейшая работа не возможна.
			// Список доступных статусов:
			// 
			// * `-1` – Песочница не создана.
			// 
			// * `0` – Песочница создана без ошибок.
			// 
			// * `1` – Песочница не смогла зарезолвить ссылку до require.js.
			// 
			// * `2` – Песочница не смогла получить правильные ссылки для функций `require` 
			// и `define`.
			// 
			// * `3` – Загрузчик не смог загрузить файл с require.js в песочницу.
			this.api = {
				name: this.options.name,
				require: null,
				define: null,
				status: -1,
				destroy: utils.bind(function() {
					this.sandbox = null;
					this.iframe.parentNode.removeChild(this.iframe);
					this.iframe = null;

					// Рекурсивно удаляем свойства api песочницы.
					for (var key in this.api) {
						if (this.api.hasOwnProperty(key)) {
							delete this.api[key];
						}
					}
				}, this)
			};

			this.createSandbox(function(sandbox) {
				console.debug('Sandbox with name "' + this.options.name + '" is created!', sandbox, sandbox.document.body);

				// Прокидываем экспорты в песочницу.
				for (var key in this.options.sandboxLinks) {
					if (this.options.sandboxLinks.hasOwnProperty(key)) {
						sandbox[key] = this.options.sandboxLinks[key];
					}
				}

				// Добавляем публичное api в песочницу.
				this.sandbox.sandboxApi = utils.extend({}, this.api, {
					parentWindow: window
				});

				// Резолвим ссылку на require.js для песочницы.
				requireResolver.resolve(
					utils.bind(function(requireUrl) {
						// Сохраняем зарезовленный урл и создаем загрузчик в песочнице.
						this.requireUrl = requireUrl;
						this.createLoader(sandbox);
					}, this),
					utils.bind(function(errorMsg) {
						// Если колбек не объявлен, то выкидываем ошибку.
						this.api.status = this.sandbox.sandboxApi.status = 1;
						this.options.error.call(this.api);
						console.error(errorMsg);
					}, this),
				this.options);
			});
			return this.api;
		};

	Sandbox.prototype = {
		createSandbox: function(callback) {
			this.createFrame(null, utils.bind(function(iframe) {
				// Сохраняем ссылку на песочницу.
				this.iframe = iframe;

				// Получаем и сохраняем ссылку на объект `window` в созданом `sandbox`.
				this.sandbox = this.iframe.contentWindow;

				// Добавляем пустой элемент `script` в `head` `iframe` для правильной работы 
				// загрузчика.
				this.createScript(this.sandbox);

				if (typeof(callback) === 'function') {
					callback.call(this, this.sandbox);
				}
			}, this));
		},

		createFrame: function(src, callback) {
			var iframe = document.createElement('iframe'),
				readyStateHandler = function() {
					if (document.readyState === 'complete') {
						console.debug('DOM is ready. Appending iframe');

						document.body.appendChild(iframe);
						return true;
					}
					return false;
				},
				onLoadHandler = function() {
					if (typeof(callback) === 'function') {
						callback(iframe);
					}
				};

			// Устанавливаем необходимые атрибуты.
			iframe.style.display = 'none';
			iframe.src = src || 'javascript:0';
			iframe.tabIndex = -1;

			// Навешиваем обработчик на событие полной отрисовки _iframe_ и всего его содержимого
			if (iframe.addEventListener) {
				iframe.addEventListener('load', onLoadHandler, false);
			} else if (iframe.attachEvent) {
				iframe.attachEvent('onload', onLoadHandler);
			} else {
				iframe.onload = onLoadHandler;
			}

			if (!readyStateHandler()) {
				console.debug('DOM isn\'t ready. Subscribing to "onreadystatechange" event');

				document.onreadystatechange = (function(originalHandler) {
					return function() {
						var returnData;

						if (typeof(originalHandler) === 'function') {
							returnData = originalHandler.apply(this, arguments);
						}
						readyStateHandler.apply(this, arguments);
						return returnData;
					};
				})(document.onreadystatechange);
			}
		},

		createScript: function(window, src, dataAttributes, callback, error) {
			var script = null,
				loaded = false,
				successHandler,
				errorHandler;

			if (typeof(dataAttributes) === 'function') {
				errorHandler = callback;
				successHandler = dataAttributes;
				dataAttributes = void(0);
			} else {
				successHandler = callback;
				errorHandler = error;
			}

			if (window && window.document && window.document.body) {
				// Создаем тег `script`.
				script = window.document.createElement('script');

				// Если передан массив дата-аттрибутов, то добавляем его в тег.
				if (typeof(dataAttributes) === 'object') {
					for (var key in dataAttributes) {
						if (dataAttributes.hasOwnProperty(key) && dataAttributes[key] != null) {
							script.setAttribute('data-' + key, dataAttributes[key]);
						}
					}
				}

				// Если передан путь до файла, то указываем его у тега.
				switch (typeof(src)) {
					case 'string':
						if (src) {
							script.src = src;
						} else if (typeof(errorHandler) === 'function') {
							errorHandler(false, window);
							return;
						}
						break;
					case 'object':
					case 'undefined':
						if (typeof(errorHandler) === 'function') {
							errorHandler(false, window);
						}
						return;
				}

				// Если переданный аргумент `successHandler` - функция, то реалзиовываем кроссбраузерный 
				// колбек.
				if (typeof(successHandler) === 'function') {
					script.onload = script.onerror = script.onreadystatechange = function(event) {
						if (!loaded) {
							loaded = true;
							script.onload = script.onerror = script.onreadystatechange = null;

							if (event.type === 'load' || this.readyState === 'loaded' || this.readyState === 'complete') {
								successHandler(script, window);
							} else if (typeof(errorHandler) === 'function' && (event.type === 'error' || this.readyState === 'error')) {
								errorHandler(script, window);
							}
						}
					};
				}

				// Вставляем тег `script` в DOM.
				window.document.getElementsByTagName('head')[0].appendChild(script);
			}
		},

		createLoader: function(target) {
			var loadHandler = function(script, sandbox) {
					var patchList = this.options.patch,
						patchModule = function(module, patch) {
							patch.enable(window, sandbox, module);
							console.debug('Patch for module "' + patch.name + '" applied correctly');
						},
						success = utils.bind(function() {
							console.debug('Executing module callback');

							// Если в модуль был передана функция-обработчик, то вызываем ее, передавая в 
							// качестве аргументов ссылку на функцию `require` их песочницы.
							this.options.success.call(this.api, this.api.require, this.api.define);
						}, this),
						resolvePatch = function(patch) {
							for (var i = 0, length = patchList.length; i < length; i++) {
								if (typeof(patchList[i]) === 'string' && patch.name === patchList[i]) {
									patchList[i] = patch;
									console.debug('Patch "' + patch.name + '" is resolved.');
									break;
								}
							}

							if (!--unresolvedPatchesCount) {
								success();
							}
						},
						applyPatch = function(moduleName, module) {
							for (var i = 0, length = patchList.length, patch; i < length; i++) {
								patch = patchList[i];

								if (patch.name == moduleName) {
									patchModule(module || sandbox[patch.shimName], patch);
								}
							}
						},
						unresolvedPatchesCount = 0,
						preprocessPlugin;

					// Создаем ссылку на `require.js` в api песочницы для дальнейшей работы с ним
					this.api.require = this.sandbox.sandboxApi.require = sandbox.require;
					this.api.define = this.sandbox.sandboxApi.define = sandbox.define;
					this.api.status = this.sandbox.sandboxApi.status = 0;

					// В режиме дебага добавляем в апи песочницы ссылку на инстанс менеджера.
					if (this.options.debug) {
						this.api.sandboxManager = this;
					}

					if (typeof(this.api.require) !== 'function' || typeof(this.api.define) !== 'function') {
						// Если мы не смогли получить доступ к функциям require.js внутри 
						// песочницы, то скорее всего мы ошибочно зарезолвили путь до библиотеки.
						// Сбрасываем резолвер.
						requireResolver.reset();

						// Сбрасываем статусы песочницы и вызываем обработку ошибки.
						this.api.status = this.sandbox.sandboxApi.status = 2;
						this.options.error.call(this.api);
						console.error('Can not gain access to require.js inside sandbox');
						return;
					}

					// Конфигурируем загрузчик на основе переданных параметров.
					this.api.require.config(this.options.requireConfig);

					// Создаем список плугинов, что указаны в конфиге
					for (var i = 0, length = this.options.plugins.length; i < length; i++) {
						var pluginObj = this.options.plugins[i],
							pluginName = '' + pluginObj.name,
							skipThisPlugin = false;

						if (!pluginName) {
							console.error('Registered plugin has no name');
							skipThisPlugin = true;
						}

						if (typeof(pluginObj.handler) !== 'function') {
							console.error('Registered plugin handler is not a function');
							skipThisPlugin = true;
						}

						console.debug('Successfuly registered plugin with name: ' + pluginName);

						// Регистрируем плугин.
						if (!skipThisPlugin) {
							this.api.define(pluginName, pluginObj.handler);
						}
					}

					console.debug('Creating predefined modules');

					// Для того чтоб разработчик могу получить доступ к объекту `window` 
					// песочницы, создаем модуль с названием `sandbox`.
					this.api.define('sandbox', function() {
						return sandbox;
					});

					// Модуль `patch` предназначен для ручного патчинга окружения, когда 
					// автоматический режим не возможен.
					this.api.define('patch', function() {
						return function(name, module) {
							var list = name;

							if (typeof(list) === 'string') {
								list = {};
								list[name] = module;
							}

							for (var key in list) {
								if (list.hasOwnProperty(key)) {
									applyPatch(key, list[key]);
								}
							}
						};
					});

					console.debug('Creating "preprocess" plugin for sandbox require.js');

					// Создаем инстанс плагина, с переданным контекстом.
					preprocessPlugin = new PreprocessPlugin(sandbox);

					// Регистрируем плагин загрузки и препроцессинга ресурсов.
					this.api.define(preprocessPlugin.name, preprocessPlugin.handler);

					console.debug('Creating handler for amd modules load');

					// Для того чтоб пропатчить модули до того как они будут зарезолвлены 
					// пользователю создаем обработчик который будет отлавливать момент 
					// загрузки + резолвинга и отслеживать нужные модули.
					this.api.require.onResourceLoad = function(context, map) {
						// Проверяем имя модуля и делаем его патч если необходимо.
						applyPatch(map.name, context.defined[map.id]);
					};

					console.debug('Checking for unresolved patches');

					// Так как при резолвинге нельзя делать отложенный патч модуля нужно 
					// разрезолвить все модули до окончательной инициализации песочницы.
					for (i = 0, length = patchList.length; i < length; i++) {
						if (typeof(patchList[i]) === 'string') {
							var patchName = patchList[i],
								patchPath = ['requirejs-sandbox', 'patches', patchName].join('/');

							// Делаем проверку если на странице нет require.js, то резолвим патчи 
							// через глобальный объект `requirejsSandbox`.
							if (window.require && typeof(window.require.defined) === 'function') {
								if (window.require.defined(patchPath)) {
									console.debug('Patch "' + patchPath + '" is resolved in parent page. Linking with patch list...');
									patchList[i] = window.require(patchPath);
								} else {
									unresolvedPatchesCount++;
									console.debug('Patch "' + patchPath + '" is unresolved. Resolving...');
									window.require([patchPath], resolvePatch);
								}
							} else if (window.requirejsSandbox && window.requirejsSandbox.patches && window.requirejsSandbox.patches[patchName]) {
								patchList[i] = window.requirejsSandbox.patches[patchName];
							}
						}
					}

					// Если нет не зарезолвленных патчей то окончательно инициализируем песочницу.
					if (!unresolvedPatchesCount) {
						success();
					}
				};

			// Вставляем с песочницу скрипт reuqire.js.
			this.createScript(target, this.requireUrl, {
				main: this.options.requireMain
			}, utils.bind(loadHandler, this), utils.bind(function() {
				// Сбрасываем резолвер.
				requireResolver.reset();

				// Сбрасываем статусы песочницы и вызываем обработку ошибки.
				this.api.status = this.sandbox.sandboxApi.status = 3;
				this.options.error.call(this.api);
				console.error('Can not load require.js into sandbox');
			}, this));

			console.debug('Creating loader inside specified target:', target);
		}
	};

	// Конфигурируем логирование ошибок.
	console.setLogLevel('debug');
	console.setNamespace('requirejs-sandbox');

	return {
		_getSandboxInternalInterface: function() {
			return Sandbox.prototype;
		},

		get: function(name) {
			return createdSandboxes[name];
		},

		set: function(name, params) {
			var sandbox;

			if (typeof(name) === 'string') {
				sandbox = this.get(name);

				if (sandbox && sandbox.status <= 0) {
					console.warn('Sandbox with name: ' + name + ' already exist! Returning existed sandbox.', sandbox);
					return sandbox;
				}
				return createdSandboxes[name] = new Sandbox(utils.extend({}, params, {
					name: name
				}));
			} else {
				console.error('Sandbox name should be string');
			}
		},

		destroy: function(name) {
			var sandbox = this.get(name);

			if (sandbox) {
				sandbox.destroy();
				delete createdSandboxes[name];
			} else {
				console.warn('Sandbox with name: "' + name + '" was not found');
			}
		}
	};
});

	return require('sandbox-manager');
}));

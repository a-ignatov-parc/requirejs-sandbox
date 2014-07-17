# Description

Sandbox manager for [require.js](http://requirejs.org/) allows user to run multiple apps without scope intersection issues. Sandbox can be helpful when running your app with other apps and you don't want to change your app's codebase. You can just setup and run.

---

[![Build Status](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox.png?branch=master)](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox)
[![Code Climate](https://codeclimate.com/github/a-ignatov-parc/requirejs-sandbox.png)](https://codeclimate.com/github/a-ignatov-parc/requirejs-sandbox)

# Use cases

`require-sandbox` can be used for:

1. Avoiding conflicts with page's libs and scripts by running widgets in a sandboxed environment with full access to the parent page.
1. Creating widgets that can be used as standalone applications or injected in the user's pages without any changes in the codebase.
1. Running widgets simultaneously using different lib versions. there are no problems while running widgets written with [jQuery](http://jquery.com/) `1.4.x` and `2.0.x` together.

	> For example see demo #2

1. Running widgets simultaneously with different conflicting libs as dependencies. You can easily run widgets written with [jQuery](http://jquery.com/) and [MooTools](http://mootools.net/) on one page without worrying about incompatibilities.
1. Creating API lib with it's own set of libraries (e.g. `jQuery`, `easyXDM`, etc) that will not affect parent page environment.

# Demos

1. [Basic demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/basic/) – loading app through config manager, css loading and working with patches.
1. [Multiple sandboxes demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/multiple-jquery/) – loading multiple [jQuery](http://jquery.com/) versions in different sandboxes with code execution without intercepting main page scope.
1. [Twitter bootstrap sandboxing demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/bootstrap/) – trying to lunch [bootstrap](http://getbootstrap.com/) components on page with old [jQuery](http://jquery.com/) and in sandbox with new version.
1. [Multiple webapps demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/todomvc/) – trying to lunch two [todomvc](http://todomvc.com/) webapps. One created with [angular.js](http://angularjs.org/) and another with [backbone.js](http://backbonejs.org/). All apps running without any changes in source code.
1. [Preprocess demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/preprocess/) – Examples of how app code can be changed with built-in preprocessors. js and css preprocessor used in this demo.

# API

Manager is defined as an UMD module and can be easily used with [require.js](http://requirejs.org/)

```javascript
require(['requirejs-sandbox'], function(requirejsSandbox) {
    requirejsSandbox.set( ... );
});
```

or as global variable if no `define` function is specified:

```javascript
window.requirejsSandbox.manager.set( ... );
```

The module has a public api:

###.get( name )

> Returns sandbox instance with the requested name if it was created. Otherwise returns `undefined`

* **name** *Type: String*
	
	> Name of the early created sandbox.

###.set( name, params )

> Create and returns sandbox with the specified name and params.

* **name** *Type: String*
	
	> Name for sandbox that will be created.

* **params** *Type: Object*
	
	> List of options for creating new sandbox.
	
	* **debug** *Type: Boolean* (default: `false`)
		
		> Enables the debug mode that provides extended api for callback arguments.
	
	* **requireUrl** *Type: String*
	
		> Link to require.js to be used in sandbox. You should use link to require.js the same as in the parent page. If you have correctly configured the cache, than the file won't be loaded twice.
		
		```javascript
		requirejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js'
		});
		```
						
	* **requireMain** *Type: String*
	
		> If you have require.js start script you should point link to it in this parameter.
		
		```javascript
		requirejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main'
		});
		```
			
	* **requireConfig** *Type: Object*
	
		> If you don't use start script to configure require.js in sandbox you can do this setting config in this parameter.
		
		```javascript
		requirejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireConfig: {
				baseUrl: 'app',
				paths: {
					'backbone': '/static/js/libs/backbone',
					'jquery': '/static/js/libs/jquery/jquery.min',
					'underscore': '/static/js/libs/underscore.min'
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
			}
		});
		```
			
	* **sandboxLinks** *Type: Object*
	
		> If you need to link variables from the main page to sandbox you can specify them as hash object with links. The defined key will be available in sandbox as `window.key`.
		
		```javascript
		requirejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireConfig: {
				baseUrl: 'app'
			},
			sandboxLinks: {
				myObject: {
					a: 1
				}
			}
		});
		```
			
		After specifying links in `sandboxLinks` you can access them in sandbox like:
		
		```javascript
		alert(window.myObject.a);
		```
			
		or
		
		```javascript
		requirejsSandbox.set('TestApp', {
			debug: true, // Enabling extended callback api to be able access sandboxManager object
			requireUrl: '/static/js/libs/require.min.js',
			requireConfig: {
				baseUrl: 'app'
			},
			sandboxLinks: {
				myObject: {
					a: 1
				}
			},
			success: function(require) {
				alert(this.sandboxManager.sandbox.myObject.a);
			}
		});
		```
			
	* **patch** *Type: Array of strings or objects*
	
		> The list of patch names to be applied to sandbox's environment. Patches are required to configure libs in sandbox working transparently with main page objects (`window`, `document` objects etc.).
		
		```javascript
		requirejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main',
			patch: ['jquery', patchObject]
		});
		```

		> Objects passed to patch list should be created with patch helper (`requirejs-sandbox/helpers/patch`) by running `patchAbstract.init` method with passed patch object as argument.

		Patch example used in [todomvc demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/todomvc/)

		```javascript
		requirejs(['requirejs-sandbox/helpers/patch'], function(patchAbstract) {
			var patch = patchAbstract.init({
				name: 'backbone',
				shimName: 'Backbone',
				enable: function(window, sandbox, Backbone) {
					Backbone.history.location = window.location;
					Backbone.history.history = window.history;
				}
			})
		});
		```

		Every patch can create wrapped instance with custom options by executing `setOptions` method

		```javascript
		requirejs(['requirejs-sandbox/patches/jquery'], function(jqueryPatch) {
			var patchWithCustomRoot = jqueryPatch.setOptions({
				rootEl: document.getElementById('new-root-el')
			});
		});
		```

		> While `patchWithCustomRoot` has custom root object original `jqueryPatch` still has default root element setted to `window.document.body`.
			
	* **plugins** *Type: Array of objects*
	
		> You can specify plugins that will be available in sandbox `requirejs` object. Listed objects will be passed through `define` function and create plugins with specified `name` and `handler`

		```javascript		
		var plugin = {
			name: 'plugin_name',
			handler: function() {
				return {
					load: function(name, req, onload) {
						onload({
							myObject: {
								a: 1
							}
						});
					}
				}
			}
		};
		
		requirejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main',
			plugins: [plugin],
			success: function(require) {
				require(['plugin_name!module'], function(moduleData) {
					alert(moduleData.myObject.a);
				});
			}
		});
		```
	
	* **success** *Type: Function*
	
		> You can specify success handler for sandbox creating process. When sandbox will be created it will execute passed function with 2 arguments: `sandbox.require` and `sandbox.define` functions. 
		
		`this` will be an api object that contains next fields:
		
		* **name** – Name given to sandbox instance on its creation;

		* **require** – Link to require function inside sandbox;

		* **define** – Link to define function inside sandbox;

		* **status** – Sandbox status
		
			> Can be set to:

			> 1. `-1` – Sandbox is not created;
			> 1. `0` – Sandbox is created without error and functioning normally;
			> 1. `>1` – Sandbox is broken and not able to work any more. Integer values > 0 can be interpreted as error code.
		
		* **destroy** – Method to destroy sandbox instance;
		
		* **sandboxManager** (extended debug api) – Link to manager instance of created sandbox.
		
	* **error** *Type: Function*

		> You can specify error handler for sandbox creating process. If sandbox will fail to be created you'll be able to handle this situation.

		`this` will be an api object same as in `success` handler.

###.destroy( name )

> Destroys the sandbox instance and frees all used resources.

* **name** *Type: String*
	
	> Name of the early created sandbox to be destroyed.

# Built-in modules

There are list of built-in modules that you can use in developing widgets. This modules available only in sanbox's require.js

1. `sandbox` – return link to sandbox's `window` object.

	```javascript
	sandbox.define('someModule', ['sandbox'], function(sandbox) {
		alert(sandbox.jQuery)
	});
	```

# Plugins

There are list of built-in and plugable plugins for [require.js](http://requirejs.org/) that are available in sandbox.

> [Here](http://requirejs.org/docs/plugins.html) you can find more information about how plugins work in require.js.

## Built-in plugins

Built-in plugins are avalable only in sandbox [require.js](http://requirejs.org/) instance.

1. `preprocess` - Plugin that loads js module or script and return additional api to preprocess source code before executing. This plugin downloads files via XMLHttpRequest and request CORS to be available for cross-domain downloads or plugin will fail to default download mechanism via `script` tag.
	
	`preprocess` plugin will return object with next properties and methods:
	
	* **id** *Type: Number* – Unique id across all processed scripts.

	* **status** *Type: Number* – Status number. Can be in range from 0 to 6.
		* `0` – File was loaded successful and preprocessor was created correctly.
		* `1` – Preprocessor was created correctly but requested resorce was not loaded.
		* `2` – CORS is not supported. Fallback to default loader. No preprocessing available.
		* `3` – Requested files was not found. 404 response status.
		* `4` – Requested file was loaded with unsupported response status.
		* `5` – There was error on file download.
		* `6` – Unknown error.

	* **replace( pattern, replacement )** *Type: Function* – Method that allows replacement of any part of source code.
	
		`pattern` can be string and regexp. 
	
		> This method is chainable.

		> Will be available only on preprocessor's success status.

	* **resolve( [callback] )** *Type: Function* – Method that resolve and execute processed source code. Can accept callback function as argument. 
	
		> This method is chainable.
		
		> Will be available only on preprocessor's success status.

	* **autoFix( [customPropList] )** *Type: Function* – Method that replace addressing to global variables such as `window.document` and `window.location` to custom varables that links to parent variables. 
	
		`customPropList` – array of names of properties or methods that should be replaced with custom variables that links to same vars in parent page.
		
		> Be careful with adding custom properties! This can break your code in unexpected way.
	
		List of replaceable variables:
	
		1. `__window_location` – replace `window.location` and `location`.
		1. `__window_document` – replace `window.document` and `document`.

		> This method is chainable.
		
		> Will be available only on preprocessor's success status.
	
## Plugable plugins

Plugable plugins placed in external files so you can use them only when you need them.

1. `css` – Plugin that allows to treat resource as css and load it as normal amd module.
1. `preprocess-css` – Plugin that allows to treat resource as css and load it with `preprocess` plugin providing extra api to process recource's source code.

	`preprocess-css` plugin will return object with next properties and methods:
	
	* **id** *Type: Number* – Unique id across all processed scripts and styles.

	* **status** *Type: Number* – Status number. Can be in range from 0 to 6.
		* `0` – File was loaded successful and preprocessor was created correctly.
		* `1` – Preprocessor was created correctly but requested resorce was not loaded.
		* `2` – CORS is not supported. Fallback to default loader. No preprocessing available.
		* `3` – Requested files was not found. 404 response status.
		* `4` – Requested file was loaded with unsupported response status.
		* `5` – There was error on file download.
		* `6` – Unknown error.

	* **replace( pattern, replacement )** *Type: Function* – Method that allows replacement of any part of source code. 
	
		`pattern` can be string and regexp. 
	
		> This method is chainable.

		> Will be available only on preprocessor's success status.
	
	* **prefix( selector )** *Type: Function* – Method that prefix all selectors with given selector.
	
		> This method is chainable.

		> Will be available only on preprocessor's success status.


# How to build your own requirejs-sandbox

First, clone a copy of the main git repo by running:

```bash
git clone https://github.com/a-ignatov-parc/requirejs-sandbox.git
```

Install the [grunt-cli](http://gruntjs.com/getting-started#installing-the-cli) if you haven't before. These should be done as global installs:

```bash
npm install -g grunt-cli
```

Make sure you have `grunt` installed by testing:

```bash
grunt -version
```

Enter the requirejs-sandbox directory and install the Node dependencies, this time *without* specifying a global(-g) install:

```bash
cd requirejs-sandbox && npm install
```

Then, to get a complete, minified (w/ Uglify.js), linted (w/ JSHint) version of requirejs-sandbox, type the following:

```bash
grunt compile
```

The built version of requirejs-sandbox will be put in the `build/` subdirectory, along with the minified copy.

# Branch policy

1. All new features are creating in branches.
1. After finishing developing of the feature it must me be merged into `master`.
1. When new tag should be created `master` merge into `release` branch.
1. After merging `master` into `release` tag should be created and `release` branch should be merged into `gh-pages` branch to update code for public demos.

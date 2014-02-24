# Description

Sandbox manager for [require.js](http://requirejs.org/) allows user to run multiple apps without scope intersection issues. Sandbox can be helpful when running your app with other apps and you don't want to change your app's codebase. You can just setup and run.

---

[![Build Status](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox.png?branch=master)](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox)

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

# API

Manager is implemented as an AMD module and can be easily used with [require.js](http://requirejs.org/)

```javascript
require(['requirejs-sandbox'], function(requrejsSandbox) {
    // code here
});
```

The module has a public api:

###.get( name )

* **name** *Type: String*
	
	> Name of the early created sandbox.

---

Returns sandbox instance with the requested name if it was created. Otherwise returns `undefined`

###.set( name, params )

* **name** *Type: String*
	
	> Name for sandbox that will be created.

* **params** *Type: Object*
	
	> List of options for creating new sandbox.
	
	* **debug** *Type: Boolean* (default: `false`)
		
		> Enables the debug mode that provides extended api for callback arguments.
	
	* **requireUrl** *Type: String*
	
		> Link to require.js to be used in sandbox. You should use link to require.js the same as in the parent page. If you have correctly configured the cache, than the file won't be loaded twice.
		
		```javascript
		requrejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js'
		});
		```
						
	* **requireMain** *Type: String*
	
		> If you have require.js start script you should point link to it in this parameter.
		
		```javascript
		requrejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main'
		});
		```
			
	* **requireConfig** *Type: Object*
	
		> If you don't use start script to configure require.js in sandbox you can do this setting config in this parameter.
		
		```javascript
		requrejsSandbox.set('TestApp', {
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
		requrejsSandbox.set('TestApp', {
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
		requrejsSandbox.set('TestApp', {
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
			callback: function(require) {
				alert(this.sandboxManager.sandbox.myObject.a);
			}
		});
		```
			
	* **patch** *Type: Array of strings or objects*
	
		> The list of patch names to be applied to sandbox's environment. Patches are required to configure libs in sandbox working transparently with main page objects (`window`, `document` objects etc.).
		
		```javascript
		requrejsSandbox.set('TestApp', {
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
		
		requrejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main',
			plugins: [plugin],
			callback: function(require) {
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

---

Create and returns sandbox with the specified name and params.

###.destroy( name )

* **name** *Type: String*
	
	> Name of the early created sandbox to be destroyed.
	
---

Destroys the sandbox instance and frees all used resources.

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

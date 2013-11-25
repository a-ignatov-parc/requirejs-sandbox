# Description

Sandbox manager for [require.js](http://requirejs.org/) that allows to multiple apps without theirs execution scope intersection. Can be helpfull when you need to run your app with other apps and you don't want to change your app codebase. Just setup and run.

---

[![Build Status](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox.png?branch=master)](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox)

# Use cases

`require-sandbox` can be used to:

1. Avoid conflicts with page's libs and scripts by running widgets in sandboxed enviroment with full access to parent page;
1. Create widgets that can be used as standalone applications or injected in user's pages without any changes in codebase;
1. Run simultaneous widgets using different lib versions. No problems to run widgets written with [jQuery](http://jquery.com/) `1.4.x` and `2.0.x` together;
	> For example see demo #2
1. Run simultaneous widgets with different conflicting libs as dependencies. You can easily run widgets written with [jQuery](http://jquery.com/) and [MooTools](http://mootools.net/) on one page without worring to have conflicts;

# Demos

Demo experiments list of requirejs-sandbox features:

1. [Basic demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/basic/) – loading app through config manager, css loading and working transits;
1. [Multiple sandboxes demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/multiple-jquery/) – loading multiple [jQuery](http://jquery.com/) versions in different sandboxes with code execution without intercepting main page scope;

# API

Manager is implemented as amd module and can be easily used with [require.js](http://requirejs.org/)

```javascript
require(['requirejs-sandbox'], function(requrejsSandbox) {
    // code here
});
```

Module has public api:

###.get( name )

* **name** *Type: String*
	
	> Name of the early created sandbox.

---

Returns sandbox instance with requested name if it was created. Otherwise returns `undefined`

###.set( name, params )

* **name** *Type: String*
	
	> Name for sandbox that will be created.

* **params** *Type: Object*
	
	> List of options for creating new sandbox.
	
	* **debug** *Type: Boolean* (default: `false`)
		
		> Enables debug mode that provide extended api for callback arguments.
	
	* **requireUrl** *Type: String*
	
		> Link to require.js to be used in sandbox. You should use link to require.js same as in parent page. If you have correctly configured cache than file won't be loaded twice.
		
		```javascript
		requrejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js'
		});
		```
						
	* **requireMain** *Type: String*
	
		> If you have require start script you should point link to it in this parameter.
		
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
	
		> If you need to link varialbles from main page to sandbox you can specify them in this parameter. Defined key will be available in sandbox as `window.key`.
		
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
			
	* **patch** *Type: Array of strings*
	
		> List of patches' names to be applied to sandbox environment. Patches are required to configure libs in sandbox work transperently with main page objects (`window`, `document` objects etc.).
		
		```javascript
		requrejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main',
			patch: ['jquery']
		});
		```
			
	* **plugins** *Type: Array of objects*
	
		> You can specify plugins that will be available in sandbox requirejs object. Setted objects will be passed through `define` function and create plugins with specified `name` and `handler`

		```javascript
		var plugin = {
			name: 'css',
			handler: function() {
				return {
					load: function(name, req, onload) {
						onload({
							// module content
						});
					}
				}
			}
		};
		
		requrejsSandbox.set('TestApp', {
			requireUrl: '/static/js/libs/require.min.js',
			requireMain: 'app/main',
			plugins: [plugin]
		});
		```

---

Create and returns sandbox with specified name and params.

###.destroy( name )

* **name** *Type: String*
	
	> Name of the early created sandbox to be destroyed.
	
---

Destroy sandbox instance and free all used resources.

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
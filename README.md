# Description

Sandbox manager for [require.js](http://requirejs.org/) that allows to multiple apps without theirs execution scope intersection.

---

[![Build Status](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox.png?branch=master)](https://travis-ci.org/a-ignatov-parc/requirejs-sandbox)

# Demos

Demo experiments list of requirejs-sandbox features:

* [Basic demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/basic/) – loading app through config manager, css loading and working transits;
* [Multiple sandboxes demo](http://a-ignatov-parc.github.io/requirejs-sandbox/demos/multiple-jquery/) – loading multiple `jQuery` versions in different sandboxes with code execution without intercepting main page scope;

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

# Use cases

Soon…

# Options

Soon…
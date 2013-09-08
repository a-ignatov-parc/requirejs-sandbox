define('name', ['dep1', 'dep2'], function(obj1, obj2) {
	return {
		prop1: obj1,
		prop2: obj2
	}
});

define('dep1', function() {
	return {
		a: 1
	}
});

define('dep2', ['dep3'], function(obj) {
	return {
		prop: obj
	}
});

define('dep3', function() {
	return 2;
});

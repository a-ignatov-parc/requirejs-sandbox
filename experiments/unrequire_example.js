(function() {
	var name, dep1, dep2, dep3;

	var __name = function(obj1, obj2) {
			return {
				prop1: obj1,
				prop2: obj2
			}
		};

	var __dep1 = function() {
			return {
				a: 1
			}
		};

	var __dep2 = function(obj) {
			return {
				prop: obj
			}
		};

	var __dep3 = function() {
			return 2;
		};

	if (dep1 == null) {
		dep1 = __dep1();
	}

	if (dep3 == null) {
		dep3 = __dep3();
	}

	if (dep2 == null) {
		dep2 = __dep2(dep3);
	}

	if (name == null) {
		name = __name(dep1, dep2);
	}

	window.NameConstructor = name;
})();
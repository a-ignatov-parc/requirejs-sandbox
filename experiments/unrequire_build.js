(function(__export_target) {
	var dep1 = (function() {
		return {
			a: 1
		}
	})();
	var dep3 = (function() {
		return 2
	})();
	var dep2 = (function(obj) {
		return {
			prop: obj
		}
	})(dep3);
	var name = (function(obj1, obj2) {
		return {
			prop1: obj1,
			prop2: obj2
		}
	})(dep1, dep2);
	__export_target["NameConstructor"] = name;
})(window);

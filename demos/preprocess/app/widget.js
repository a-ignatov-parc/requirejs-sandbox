define(['jquery'], function($) {
	return {
		run: function() {
			$('body').append('<li>Executed without preprocessing</li>');
		}
	}
});

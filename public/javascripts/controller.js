(function() {

var imgApp = angular.module('imgApp', []);

imgApp.controller('imgCtrl', ['$scope', '$http', function($scope, $http) {
	$scope.clearThis = function(Url) {
		Url = Url.replace('/images','');
		console.log(Url);
		$http.delete('/removeLocal'+Url);
	};
}]);

})();
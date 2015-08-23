(function() {

var imgApp = angular.module('imgApp', []);

imgApp.controller('imgCtrl', ['$scope', '$http', function($scope, $http) {
	$scope.clearThis = function(Url) {
		Url = Url.replace('/images/temp','');
		$http.delete('/removeLocal'+Url);
	};
	
	$scope.getThis = function(Url) {
		Url = Url.replace('/images/temp','');
		$http.get('/details'+Url);
	}
}]);

})();
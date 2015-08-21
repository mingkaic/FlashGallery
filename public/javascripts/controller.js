(function() {

console.log('hi');
var imgApp = angular.module('myApp-browse', []);

imgApp.controller('imgCtrl', ['$scope', '$http', function($scope, $http) {
	$scope.clearThis = function(Url) {
		console.log(Url);
		$http.delete('/removeLocal'+Url);
	};
}]);

})();
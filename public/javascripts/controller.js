(function() {

var imgApp = angular.module('imgApp', []);

imgApp.controller('imgCtrl', ['$scope', '$http', '$window', function($scope, $http, $window) {
	$scope.clearThis = function(Url) {
		Url = Url.replace('/images/temp','');
		$http.delete('/removeLocal'+Url).success(function(response) {
			$window.location.href = '/';
		});
	};
	
	$scope.getThis = function(Url) {
		Url = Url.replace('/images/temp','');
		$http.get('/details'+Url);
	};
}]);

imgApp.controller('panelCtrl', ['$scope', '$http', function($scope, $http) {
	$scope.tab = 1;
	
	$scope.selectTab = function(setTab) {
		$scope.tab = setTab;
	};
	
	$scope.isSelected = function(checkTab) {
		return $scope.tab === checkTab;
	};
}]);

imgApp.controller('userCtrl', ['$scope', '$http', function($scope, $http) {
	$scope.login = function() {
		console.log($scope.user);
	}
	
	$scope.signup = function() {
		console.log($scope.user);
	}
}]);

})();
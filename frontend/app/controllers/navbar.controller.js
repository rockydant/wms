'use strict';

angular.module('fulfillflowApp')
.controller('NavbarCtrl', ['$scope', 'AuthService', '$location', function($scope, AuthService, $location) {
  $scope.user = AuthService.getCurrentUser();
  $scope.$location = $location;
  
  $scope.logout = function() {
    AuthService.logout();
    $location.path('/login');
  };
  
  // Watch for user changes
  $scope.$watch(function() {
    return AuthService.getCurrentUser();
  }, function(newUser) {
    $scope.user = newUser;
  }, true);
}]);


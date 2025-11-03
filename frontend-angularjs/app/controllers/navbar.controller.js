'use strict';

angular.module('fulfillflowApp')
.controller('NavbarCtrl', ['$scope', 'AuthService', '$location', function($scope, AuthService, $location) {
  $scope.user = AuthService.getCurrentUser();
  $scope.$location = $location;
  $scope.mobileMenuOpen = false;
  
  $scope.logout = function() {
    AuthService.logout();
    $location.path('/login');
  };
  
  $scope.toggleMobileMenu = function() {
    $scope.mobileMenuOpen = !$scope.mobileMenuOpen;
  };
  
  // Close mobile menu on navigation
  $scope.$on('$locationChangeStart', function() {
    $scope.mobileMenuOpen = false;
  });
  
  // Watch for user changes
  $scope.$watch(function() {
    return AuthService.getCurrentUser();
  }, function(newUser) {
    $scope.user = newUser;
  }, true);
}]);


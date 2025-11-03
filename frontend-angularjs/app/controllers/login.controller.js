'use strict';

angular.module('fulfillflowApp')
.controller('LoginCtrl', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {
  $scope.credentials = {
    email: '',
    password: ''
  };

  $scope.login = function() {
    AuthService.login($scope.credentials)
      .then(function(response) {
        $location.path('/');
      })
      .catch(function(error) {
        $scope.error = error.data.message || 'Login failed';
      });
  };
}]);

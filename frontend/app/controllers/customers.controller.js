'use strict';

angular.module('fulfillflowApp')
.controller('CustomersCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.customers = [];

  $scope.loadCustomers = function() {
    ApiService.get('/customers')
      .then(function(response) {
        $scope.customers = response.data;
      });
  };

  $scope.loadCustomers();
}]);

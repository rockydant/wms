'use strict';

angular.module('fulfillflowApp')
.controller('DashboardCtrl', ['$scope', 'ApiService', 'AuthService', function($scope, ApiService, AuthService) {
  $scope.user = AuthService.getCurrentUser();

  // Load dashboard data
  ApiService.get('/shipments?customerId=')
    .then(function(response) {
      $scope.recentShipments = response.data.slice(0, 5);
    });

  ApiService.get('/inventory?customerId=')
    .then(function(response) {
      $scope.inventorySummary = {
        total: response.data.length,
        ready: response.data.filter(item => item.status === 'Ready').length
      };
    });
}]);

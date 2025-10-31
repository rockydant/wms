'use strict';

angular.module('fulfillflowApp')
.controller('InventoryCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.inventoryItems = [];

  $scope.loadInventory = function() {
    ApiService.get('/inventory')
      .then(function(response) {
        $scope.inventoryItems = response.data;
      });
  };

  $scope.loadInventory();
}]);

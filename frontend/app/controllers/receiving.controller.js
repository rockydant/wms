'use strict';

angular.module('fulfillflowApp')
.controller('ReceivingCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.purchaseOrders = [];

  $scope.loadPOs = function() {
    ApiService.get('/receiving/purchase-orders')
      .then(function(response) {
        $scope.purchaseOrders = response.data;
      });
  };

  $scope.loadPOs();
}]);

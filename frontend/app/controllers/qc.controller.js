'use strict';

angular.module('fulfillflowApp')
.controller('QcCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.items = [];

  $scope.verifyItem = function(item) {
    ApiService.patch('/qc/verify', {
      queueId: item.queueId,
      itemId: item.id,
      inventoryBarcode: item.inventoryBarcode,
      pickingBarcode: item.pickingBarcode
    })
    .then(function(response) {
      if (response.data) {
        alert('Item verified successfully!');
        $scope.loadItems();
      } else {
        alert('Verification failed!');
      }
    });
  };

  $scope.loadItems = function() {
    // Load items needing QC
    ApiService.get('/picking/queues')
      .then(function(response) {
        $scope.items = response.data.flatMap(queue => queue.pickingItems || []);
      });
  };

  $scope.loadItems();
}]);

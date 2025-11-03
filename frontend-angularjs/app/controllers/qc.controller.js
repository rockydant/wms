'use strict';

angular.module('fulfillflowApp')
.controller('QcCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.orderQueues = [];
  $scope.items = [];
  $scope.showVerifyForm = false;
  $scope.selectedQueue = null;
  $scope.error = null;
  $scope.loading = false;

  $scope.verificationData = {
    queueId: '',
    itemId: '',
    inventoryBarcode: '',
    pickingBarcode: ''
  };

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return ApiService.get('/picking/queues')
      .then(function(response) {
        $scope.orderQueues = response.data;
        // Flatten picking items
        $scope.items = [];
        response.data.forEach(function(queue) {
          if (queue.pickingItems && queue.pickingItems.length > 0) {
            $scope.items = $scope.items.concat(queue.pickingItems.map(function(item) {
              item.queue = queue;
              return item;
            }));
          }
        });
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load QC items';
        console.error('Error loading QC items:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Show verify form
  $scope.showVerify = function(item) {
    $scope.showVerifyForm = true;
    $scope.verificationData = {
      queueId: item.queueId || item.queue.id,
      itemId: item.id,
      inventoryBarcode: item.inventoryItem?.inventoryBarcode || '',
      pickingBarcode: item.inventoryItem?.pickingBarcode || ''
    };
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showVerifyForm = false;
    $scope.error = null;
  };

  // Verify item
  $scope.verifyItem = function() {
    if (!$scope.verificationData.inventoryBarcode || !$scope.verificationData.pickingBarcode) {
      $scope.error = 'Both barcodes are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.patch('/qc/verify', $scope.verificationData)
      .then(function(response) {
        if (response.data && response.data.verified) {
          // Update the item in the list
          var item = $scope.items.find(function(i) {
            return i.id === $scope.verificationData.itemId;
          });
          if (item) {
            item.verified = true;
          }
          $scope.cancelForm();
          alert('Item verified successfully!');
        } else {
          $scope.error = 'Verification failed - barcodes do not match';
        }
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to verify item';
        console.error('Error verifying item:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Complete QC for queue
  $scope.completeQC = function(queue) {
    if (!confirm('Are you sure you want to mark this queue as QC completed?')) {
      return;
    }

    $scope.loading = true;
    ApiService.patch('/qc/complete', {
      queueId: queue.id,
      shipmentId: queue.shipmentId
    })
      .then(function(response) {
        // Reload data
        $scope.loadData();
        alert('QC completed successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to complete QC';
        console.error('Error completing QC:', error);
        alert('Failed to complete QC: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);

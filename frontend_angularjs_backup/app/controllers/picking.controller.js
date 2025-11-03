'use strict';

angular.module('fulfillflowApp')
.controller('PickingCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.orderQueues = [];
  $scope.shipments = [];
  $scope.showCreateForm = false;
  $scope.showDetailsForm = false;
  $scope.error = null;
  $scope.loading = false;
  $scope.optimizedRoute = null;

  $scope.newQueue = { shipmentId: '' };
  $scope.selectedQueue = null;

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return $q.all([
      ApiService.get('/shipments?status=Ready'),
      ApiService.get('/picking/queues')
    ]).then(function(results) {
      $scope.shipments = results[0].data;
      $scope.orderQueues = results[1].data;
    }).catch(function(error) {
      $scope.error = error.data?.message || 'Failed to load data';
      console.error('Error loading data:', error);
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Load queues
  $scope.loadQueues = function() {
    $scope.loading = true;
    ApiService.get('/picking/queues')
      .then(function(response) {
        $scope.orderQueues = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load picking queues';
        console.error('Error loading picking queues:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Show create form
  $scope.showCreate = function() {
    $scope.showCreateForm = true;
    $scope.showDetailsForm = false;
    $scope.newQueue = { shipmentId: $scope.shipments.length > 0 ? $scope.shipments[0].id : '' };
    $scope.error = null;
  };

  // Show details
  $scope.showDetails = function(queue) {
    $scope.showDetailsForm = true;
    $scope.showCreateForm = false;
    $scope.selectedQueue = queue;
    $scope.optimizedRoute = null;
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showCreateForm = false;
    $scope.showDetailsForm = false;
    $scope.selectedQueue = null;
    $scope.optimizedRoute = null;
    $scope.error = null;
  };

  // Create queue from shipment
  $scope.createQueue = function() {
    if (!$scope.newQueue.shipmentId) {
      $scope.error = 'Please select a shipment';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/picking/queues', { shipmentId: $scope.newQueue.shipmentId })
      .then(function(response) {
        $scope.orderQueues.push(response.data);
        $scope.cancelForm();
        alert('Picking queue created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create picking queue';
        console.error('Error creating picking queue:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Get optimized route
  $scope.getOptimizedRoute = function(queue) {
    $scope.loading = true;
    ApiService.get('/picking/queues/' + queue.id + '/route')
      .then(function(response) {
        $scope.optimizedRoute = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to get optimized route';
        console.error('Error getting optimized route:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Assign queue
  $scope.assignQueue = function(queue) {
    $scope.loading = true;
    ApiService.patch('/picking/queues/' + queue.id + '/assign')
      .then(function(response) {
        queue.status = 'In Progress';
        if (response.data) {
          angular.extend(queue, response.data);
        }
        alert('Queue assigned to you successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to assign queue';
        console.error('Error assigning queue:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Complete picking
  $scope.completePicking = function(queue) {
    if (!confirm('Are you sure you want to mark this queue as completed?')) {
      return;
    }

    $scope.loading = true;
    ApiService.patch('/picking/queues/' + queue.id + '/complete')
      .then(function(response) {
        queue.status = 'Completed';
        if (response.data) {
          angular.extend(queue, response.data);
        }
        alert('Picking completed successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to complete picking';
        console.error('Error completing picking:', error);
        alert('Failed to complete picking: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);

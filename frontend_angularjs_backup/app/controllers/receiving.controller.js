'use strict';

angular.module('fulfillflowApp')
.controller('ReceivingCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.purchaseOrders = [];
  $scope.customers = [];
  $scope.showCreateForm = false;
  $scope.showDetailsForm = false;
  $scope.error = null;
  $scope.loading = false;

  // Form data
  $scope.newPO = {
    customerId: '',
    items: []
  };

  $scope.currentItem = { sku: '', size: '', color: '', expectedQuantity: 1 };
  $scope.selectedPO = null;

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return $q.all([
      ApiService.get('/customers'),
      ApiService.get('/receiving/purchase-orders')
    ]).then(function(results) {
      $scope.customers = results[0].data;
      $scope.purchaseOrders = results[1].data;
    }).catch(function(error) {
      $scope.error = error.data?.message || 'Failed to load data';
      console.error('Error loading data:', error);
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Load POs
  $scope.loadPOs = function() {
    $scope.loading = true;
    ApiService.get('/receiving/purchase-orders')
      .then(function(response) {
        $scope.purchaseOrders = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load purchase orders';
        console.error('Error loading purchase orders:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Show create form
  $scope.showCreate = function() {
    $scope.showCreateForm = true;
    $scope.showDetailsForm = false;
    $scope.newPO = {
      customerId: $scope.customers.length > 0 ? $scope.customers[0].id : '',
      items: []
    };
    $scope.currentItem = { sku: '', size: '', color: '', expectedQuantity: 1 };
    $scope.error = null;
  };

  // Show details
  $scope.showDetails = function(po) {
    $scope.showDetailsForm = true;
    $scope.showCreateForm = false;
    $scope.selectedPO = po;
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showCreateForm = false;
    $scope.showDetailsForm = false;
    $scope.selectedPO = null;
    $scope.error = null;
  };

  // Add item to PO
  $scope.addItem = function() {
    if (!$scope.currentItem.sku || !$scope.currentItem.size || !$scope.currentItem.color || !$scope.currentItem.expectedQuantity) {
      $scope.error = 'SKU, Size, Color, and Expected Quantity are required';
      return;
    }
    $scope.newPO.items.push(angular.copy($scope.currentItem));
    $scope.currentItem = { sku: '', size: '', color: '', expectedQuantity: 1 };
    $scope.error = null;
  };

  // Remove item from PO
  $scope.removeItem = function(index) {
    $scope.newPO.items.splice(index, 1);
  };

  // Create PO
  $scope.createPO = function() {
    if (!$scope.newPO.customerId || $scope.newPO.items.length === 0) {
      $scope.error = 'Customer and at least one item are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/receiving/purchase-orders', $scope.newPO)
      .then(function(response) {
        $scope.purchaseOrders.push(response.data);
        $scope.cancelForm();
        alert('Purchase Order created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create purchase order';
        console.error('Error creating purchase order:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Complete PO
  $scope.completePO = function(po) {
    if (!confirm('Are you sure you want to mark this PO as completed?')) {
      return;
    }

    $scope.loading = true;
    ApiService.patch('/receiving/purchase-orders/' + po.id + '/complete')
      .then(function(response) {
        po.status = 'Completed';
        if (response.data) {
          angular.extend(po, response.data);
        }
        alert('Purchase Order marked as completed!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to complete purchase order';
        console.error('Error completing purchase order:', error);
        alert('Failed to complete purchase order: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);

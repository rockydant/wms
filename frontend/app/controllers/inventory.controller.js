'use strict';

angular.module('fulfillflowApp')
.controller('InventoryCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.inventoryItems = [];
  $scope.customers = [];
  $scope.showCreateForm = false;
  $scope.showEditForm = false;
  $scope.error = null;
  $scope.loading = false;
  $scope.selectedCustomerId = '';

  // Form data
  $scope.newItem = {
    customerId: '',
    sku: '',
    size: '',
    color: '',
    locationId: ''
  };

  $scope.editingItem = null;

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return $q.all([
      ApiService.get('/customers'),
      ApiService.get('/inventory')
    ]).then(function(results) {
      $scope.customers = results[0].data;
      $scope.inventoryItems = results[1].data;
      
      // Set first customer as default if available
      if ($scope.customers.length > 0 && !$scope.selectedCustomerId) {
        $scope.selectedCustomerId = $scope.customers[0].id;
      }
    }).catch(function(error) {
      $scope.error = error.data?.message || 'Failed to load data';
      console.error('Error loading data:', error);
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Filter by customer
  $scope.filterByCustomer = function() {
    if ($scope.selectedCustomerId) {
      $scope.loading = true;
      ApiService.get('/inventory?customerId=' + $scope.selectedCustomerId)
        .then(function(response) {
          $scope.inventoryItems = response.data;
        })
        .catch(function(error) {
          $scope.error = error.data?.message || 'Failed to filter inventory';
          console.error('Error filtering inventory:', error);
        })
        .finally(function() {
          $scope.loading = false;
        });
    } else {
      $scope.loadInventory();
    }
  };

  // Load all inventory
  $scope.loadInventory = function() {
    $scope.loading = true;
    ApiService.get('/inventory')
      .then(function(response) {
        $scope.inventoryItems = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load inventory';
        console.error('Error loading inventory:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Show create form
  $scope.showCreate = function() {
    $scope.showCreateForm = true;
    $scope.showEditForm = false;
    $scope.newItem = {
      customerId: $scope.selectedCustomerId || ($scope.customers.length > 0 ? $scope.customers[0].id : ''),
      sku: '',
      size: '',
      color: '',
      locationId: ''
    };
    $scope.error = null;
  };

  // Show edit form
  $scope.showEdit = function(item) {
    $scope.showEditForm = true;
    $scope.showCreateForm = false;
    $scope.editingItem = angular.copy(item);
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showCreateForm = false;
    $scope.showEditForm = false;
    $scope.editingItem = null;
    $scope.error = null;
  };

  // Create inventory item
  $scope.createItem = function() {
    if (!$scope.newItem.customerId || !$scope.newItem.sku || !$scope.newItem.size || !$scope.newItem.color) {
      $scope.error = 'Customer, SKU, Size, and Color are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/inventory', $scope.newItem)
      .then(function(response) {
        $scope.inventoryItems.push(response.data);
        $scope.cancelForm();
        alert('Inventory item created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create inventory item';
        console.error('Error creating inventory item:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Update inventory item
  $scope.updateItem = function() {
    if (!$scope.editingItem.customerId || !$scope.editingItem.sku || !$scope.editingItem.size || !$scope.editingItem.color) {
      $scope.error = 'Customer, SKU, Size, and Color are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    var updateData = {
      customerId: $scope.editingItem.customerId,
      sku: $scope.editingItem.sku,
      size: $scope.editingItem.size,
      color: $scope.editingItem.color,
      locationId: $scope.editingItem.locationId
    };

    ApiService.patch('/inventory/' + $scope.editingItem.id, updateData)
      .then(function(response) {
        // Update the item in the list
        var index = $scope.inventoryItems.findIndex(function(i) {
          return i.id === $scope.editingItem.id;
        });
        if (index !== -1) {
          $scope.inventoryItems[index] = response.data;
        }
        $scope.cancelForm();
        alert('Inventory item updated successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update inventory item';
        console.error('Error updating inventory item:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Delete inventory item
  $scope.deleteItem = function(item) {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    $scope.loading = true;
    ApiService.delete('/inventory/' + item.id)
      .then(function() {
        $scope.inventoryItems = $scope.inventoryItems.filter(function(i) {
          return i.id !== item.id;
        });
        alert('Inventory item deleted successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to delete inventory item';
        console.error('Error deleting inventory item:', error);
        alert('Failed to delete inventory item: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);

'use strict';

angular.module('fulfillflowApp')
.controller('ShipmentsCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.shipments = [];
  $scope.customers = [];
  $scope.warehouses = [];
  $scope.showCreateForm = false;
  $scope.showEditForm = false;
  $scope.error = null;
  $scope.loading = false;

  // Shipment statuses
  $scope.statuses = ['Pending', 'Receiving', 'Ready', 'Partially Shipped', 'Shipped'];

  // Form data
  $scope.newShipment = {
    customerId: '',
    warehouseId: '',
    items: []
  };

  $scope.editingShipment = null;
  $scope.currentItem = { sku: '', size: '', color: '', quantity: 1 };

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return $q.all([
      ApiService.get('/customers'),
      ApiService.get('/warehouse'),
      ApiService.get('/shipments')
    ]).then(function(results) {
      $scope.customers = results[0].data;
      $scope.warehouses = results[1].data;
      $scope.shipments = results[2].data;
    }).catch(function(error) {
      $scope.error = error.data?.message || 'Failed to load data';
      console.error('Error loading data:', error);
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Load shipments
  $scope.loadShipments = function() {
    $scope.loading = true;
    ApiService.get('/shipments')
      .then(function(response) {
        $scope.shipments = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load shipments';
        console.error('Error loading shipments:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Show create form
  $scope.showCreate = function() {
    $scope.showCreateForm = true;
    $scope.showEditForm = false;
    $scope.newShipment = {
      customerId: $scope.customers.length > 0 ? $scope.customers[0].id : '',
      warehouseId: $scope.warehouses.length > 0 ? $scope.warehouses[0].id : '',
      items: []
    };
    $scope.currentItem = { sku: '', size: '', color: '', quantity: 1 };
    $scope.error = null;
  };

  // Show edit form
  $scope.showEdit = function(shipment) {
    $scope.showEditForm = true;
    $scope.showCreateForm = false;
    $scope.editingShipment = angular.copy(shipment);
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showCreateForm = false;
    $scope.showEditForm = false;
    $scope.editingShipment = null;
    $scope.error = null;
  };

  // Add item to shipment
  $scope.addItem = function() {
    if (!$scope.currentItem.sku || !$scope.currentItem.size || !$scope.currentItem.color || !$scope.currentItem.quantity) {
      $scope.error = 'SKU, Size, Color, and Quantity are required';
      return;
    }
    $scope.newShipment.items.push(angular.copy($scope.currentItem));
    $scope.currentItem = { sku: '', size: '', color: '', quantity: 1 };
    $scope.error = null;
  };

  // Remove item from shipment
  $scope.removeItem = function(index) {
    $scope.newShipment.items.splice(index, 1);
  };

  // Create shipment
  $scope.createShipment = function() {
    if (!$scope.newShipment.customerId || $scope.newShipment.items.length === 0) {
      $scope.error = 'Customer and at least one item are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/shipments', $scope.newShipment)
      .then(function(response) {
        $scope.shipments.push(response.data);
        $scope.cancelForm();
        alert('Shipment created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create shipment';
        console.error('Error creating shipment:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Update shipment
  $scope.updateShipment = function() {
    $scope.loading = true;
    $scope.error = null;

    ApiService.patch('/shipments/' + $scope.editingShipment.id, $scope.editingShipment)
      .then(function(response) {
        var index = $scope.shipments.findIndex(function(s) {
          return s.id === $scope.editingShipment.id;
        });
        if (index !== -1) {
          $scope.shipments[index] = response.data;
        }
        $scope.cancelForm();
        alert('Shipment updated successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update shipment';
        console.error('Error updating shipment:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Delete shipment
  $scope.deleteShipment = function(shipment) {
    if (!confirm('Are you sure you want to delete this shipment?')) {
      return;
    }

    $scope.loading = true;
    ApiService.delete('/shipments/' + shipment.id)
      .then(function() {
        $scope.shipments = $scope.shipments.filter(function(s) {
          return s.id !== shipment.id;
        });
        alert('Shipment deleted successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to delete shipment';
        console.error('Error deleting shipment:', error);
        alert('Failed to delete shipment: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Update status
  $scope.updateStatus = function(shipment, status) {
    $scope.loading = true;
    ApiService.patch('/shipments/' + shipment.id + '/status', { status: status })
      .then(function(response) {
        shipment.status = response.data.status;
        alert('Status updated successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update status';
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);

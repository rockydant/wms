'use strict';

angular.module('fulfillflowApp')
.controller('WarehouseCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.locations = [];
  $scope.warehouses = [];
  $scope.heatmapData = [];
  $scope.showCreateWarehouseForm = false;
  $scope.showCreateLocationForm = false;
  $scope.showWarehouseDetailsForm = false;
  $scope.selectedWarehouse = null;
  $scope.error = null;
  $scope.loading = false;

  // Form data
  $scope.newWarehouse = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    contactPhone: '',
    contactEmail: ''
  };

  $scope.newLocation = {
    warehouseId: '',
    area: '',
    column: '',
    rack: '',
    bin: '',
    maxCapacity: 100
  };

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return $q.all([
      ApiService.get('/warehouse'),
      ApiService.get('/warehouse/locations'),
      ApiService.get('/warehouse/heatmap')
    ]).then(function(results) {
      $scope.warehouses = results[0].data;
      $scope.locations = results[1].data;
      $scope.heatmapData = results[2].data;
      
      // Set first warehouse as default if available
      if ($scope.warehouses.length > 0 && !$scope.newLocation.warehouseId) {
        $scope.newLocation.warehouseId = $scope.warehouses[0].id;
      }
    }).catch(function(error) {
      $scope.error = error.data?.message || 'Failed to load data';
      console.error('Error loading data:', error);
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Load locations
  $scope.loadLocations = function() {
    $scope.loading = true;
    ApiService.get('/warehouse/locations')
      .then(function(response) {
        $scope.locations = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load warehouse locations';
        console.error('Error loading locations:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Load heatmap
  $scope.loadHeatmap = function() {
    ApiService.get('/warehouse/heatmap')
      .then(function(response) {
        $scope.heatmapData = response.data;
      })
      .catch(function(error) {
        console.error('Error loading heatmap:', error);
      });
  };

  // Show create warehouse form
  $scope.showCreateWarehouse = function() {
    $scope.showCreateWarehouseForm = true;
    $scope.newWarehouse = {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      contactPhone: '',
      contactEmail: ''
    };
    $scope.error = null;
  };

  // Show create location form
  $scope.showCreateLocation = function() {
    $scope.showCreateLocationForm = true;
    $scope.newLocation = {
      warehouseId: $scope.warehouses.length > 0 ? $scope.warehouses[0].id : '',
      area: '',
      column: '',
      rack: '',
      bin: '',
      maxCapacity: 100
    };
    $scope.error = null;
  };

  // Show warehouse details
  $scope.showWarehouseDetails = function(warehouse) {
    $scope.showWarehouseDetailsForm = true;
    $scope.selectedWarehouse = warehouse;
    $scope.error = null;
  };

  // Cancel forms
  $scope.cancelForm = function() {
    $scope.showCreateWarehouseForm = false;
    $scope.showCreateLocationForm = false;
    $scope.showWarehouseDetailsForm = false;
    $scope.selectedWarehouse = null;
    $scope.error = null;
  };

  // Create warehouse
  $scope.createWarehouse = function() {
    if (!$scope.newWarehouse.name) {
      $scope.error = 'Warehouse name is required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/warehouse', $scope.newWarehouse)
      .then(function(response) {
        $scope.warehouses.push(response.data);
        $scope.cancelForm();
        alert('Warehouse created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create warehouse';
        console.error('Error creating warehouse:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Create location
  $scope.createLocation = function() {
    if (!$scope.newLocation.warehouseId || !$scope.newLocation.area || !$scope.newLocation.column || !$scope.newLocation.rack || !$scope.newLocation.bin) {
      $scope.error = 'Warehouse, Area, Column, Rack, and Bin are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/warehouse/locations', $scope.newLocation)
      .then(function(response) {
        $scope.locations.push(response.data);
        $scope.cancelForm();
        $scope.loadHeatmap(); // Reload heatmap
        alert('Location created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create location';
        console.error('Error creating location:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Delete location
  $scope.deleteLocation = function(location) {
    if (!confirm('Are you sure you want to delete location ' + location.locationCode + '?')) {
      return;
    }

    $scope.loading = true;
    ApiService.delete('/warehouse/locations/' + location.id)
      .then(function() {
        $scope.locations = $scope.locations.filter(function(l) {
          return l.id !== location.id;
        });
        $scope.loadHeatmap(); // Reload heatmap
        alert('Location deleted successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to delete location';
        console.error('Error deleting location:', error);
        alert('Failed to delete location: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Refresh heatmap
  $scope.refreshHeatmap = function() {
    if (!$scope.warehouses.length) {
      alert('Please create a warehouse first');
      return;
    }
    $scope.loading = true;
    ApiService.patch('/warehouse/heatmap/' + $scope.warehouses[0].id + '/refresh')
      .then(function(response) {
        $scope.loadHeatmap();
        alert('Heatmap refreshed successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to refresh heatmap';
        console.error('Error refreshing heatmap:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);

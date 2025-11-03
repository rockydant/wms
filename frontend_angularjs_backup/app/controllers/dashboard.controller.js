'use strict';

angular.module('fulfillflowApp')
.controller('DashboardCtrl', ['$scope', 'ApiService', 'AuthService', '$q', function($scope, ApiService, AuthService, $q) {
  $scope.user = AuthService.getCurrentUser();
  $scope.loading = true;
  $scope.error = null;

  // Initialize empty data
  $scope.inventorySummary = { total: 0, ready: 0 };
  $scope.recentShipments = [];
  $scope.dashboardData = null;

  // Load dashboard data from dashboard API
  ApiService.get('/dashboard')
    .then(function(response) {
      $scope.dashboardData = response.data;
      
      // Extract inventory summary
      if (response.data.overview && response.data.overview.inventory) {
        const inventory = response.data.overview.inventory;
        $scope.inventorySummary = {
          total: inventory.total || 0,
          ready: inventory.ready || 0
        };
      }
      
      // Extract recent shipments
      if (response.data.overview && response.data.overview.shipments) {
        const shipments = response.data.overview.shipments;
        // Try to get actual shipment list
        return ApiService.get('/shipments');
      }
      return $q.resolve({ data: [] });
    })
    .then(function(response) {
      if (response.data && Array.isArray(response.data)) {
        $scope.recentShipments = response.data.slice(0, 5);
      }
    })
    .catch(function(error) {
      console.error('Error loading dashboard:', error);
      $scope.error = error.data?.message || 'Failed to load dashboard data';
      
      // Fallback: try direct endpoints
      return $q.all([
        ApiService.get('/shipments').catch(function() { return { data: [] }; }),
        ApiService.get('/inventory').catch(function() { return { data: [] }; })
      ]);
    })
    .then(function(results) {
      if (results && results[0] && results[1]) {
        $scope.recentShipments = (results[0].data || []).slice(0, 5);
        const inventoryData = results[1].data || [];
        $scope.inventorySummary = {
          total: inventoryData.length,
          ready: inventoryData.filter(function(item) { return item.status === 'Ready'; }).length
        };
      }
    })
    .finally(function() {
      $scope.loading = false;
    });
}]);

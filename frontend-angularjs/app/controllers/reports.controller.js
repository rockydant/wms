'use strict';

angular.module('fulfillflowApp')
.controller('ReportsCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.receivingReport = null;
  $scope.pickingReport = null;
  $scope.shipmentReport = null;
  $scope.executiveInsights = null;
  $scope.financialSummary = null;
  $scope.departmentPerformance = null;
  $scope.realtimeDashboard = null;
  $scope.customers = [];
  $scope.selectedCustomerId = '';
  $scope.reportDate = new Date().toISOString().split('T')[0];
  $scope.startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  $scope.endDate = new Date().toISOString().split('T')[0];
  $scope.loading = false;
  $scope.error = null;

  // Load customers
  $scope.loadCustomers = function() {
    ApiService.get('/customers')
      .then(function(response) {
        $scope.customers = response.data;
      });
  };

  // Load reports
  $scope.loadReports = function() {
    $scope.loading = true;
    $q.all([
      ApiService.get('/reports/receiving/daily?date=' + $scope.reportDate).catch(function() { return { data: null }; }),
      ApiService.get('/reports/picking/daily?date=' + $scope.reportDate).catch(function() { return { data: null }; }),
      ApiService.get('/reports/shipments/daily?date=' + $scope.reportDate).catch(function() { return { data: null }; })
    ]).then(function(results) {
      $scope.receivingReport = results[0].data;
      $scope.pickingReport = results[1].data;
      $scope.shipmentReport = results[2].data;
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Load executive insights
  $scope.loadExecutiveInsights = function() {
    $scope.loading = true;
    var url = '/reports/insights/executive?startDate=' + $scope.startDate + '&endDate=' + $scope.endDate;
    if ($scope.selectedCustomerId) {
      url += '&customerId=' + $scope.selectedCustomerId;
    }
    
    ApiService.get(url)
      .then(function(response) {
        $scope.executiveInsights = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load executive insights';
        console.error('Error loading executive insights:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Load financial summary
  $scope.loadFinancialSummary = function() {
    $scope.loading = true;
    var url = '/reports/insights/financial?startDate=' + $scope.startDate + '&endDate=' + $scope.endDate;
    if ($scope.selectedCustomerId) {
      url += '&customerId=' + $scope.selectedCustomerId;
    }
    
    ApiService.get(url)
      .then(function(response) {
        $scope.financialSummary = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load financial summary';
        console.error('Error loading financial summary:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Load department performance
  $scope.loadDepartmentPerformance = function() {
    $scope.loading = true;
    var url = '/reports/performance/departments?startDate=' + $scope.startDate + '&endDate=' + $scope.endDate;
    if ($scope.selectedCustomerId) {
      url += '&customerId=' + $scope.selectedCustomerId;
    }
    
    ApiService.get(url)
      .then(function(response) {
        $scope.departmentPerformance = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load department performance';
        console.error('Error loading department performance:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Load realtime dashboard
  $scope.loadRealtimeDashboard = function() {
    $scope.loading = true;
    ApiService.get('/dashboard/realtime-operations')
      .then(function(response) {
        $scope.realtimeDashboard = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load realtime dashboard';
        console.error('Error loading realtime dashboard:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadCustomers();
  $scope.loadReports();
}]);

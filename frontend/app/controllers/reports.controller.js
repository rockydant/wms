'use strict';

angular.module('fulfillflowApp')
.controller('ReportsCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.receivingReport = null;
  $scope.pickingReport = null;
  $scope.shipmentReport = null;

  $scope.loadReceivingReport = function(date) {
    const params = date ? '?date=' + date : '';
    ApiService.get('/reports/receiving/daily' + params)
      .then(function(response) {
        $scope.receivingReport = response.data;
      });
  };

  $scope.loadPickingReport = function(date) {
    const params = date ? '?date=' + date : '';
    ApiService.get('/reports/picking/daily' + params)
      .then(function(response) {
        $scope.pickingReport = response.data;
      });
  };

  $scope.loadShipmentReport = function(date) {
    const params = date ? '?date=' + date : '';
    ApiService.get('/reports/shipments/daily' + params)
      .then(function(response) {
        $scope.shipmentReport = response.data;
      });
  };

  // Load today's reports
  $scope.loadReceivingReport();
  $scope.loadPickingReport();
  $scope.loadShipmentReport();
}]);

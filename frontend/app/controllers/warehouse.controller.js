'use strict';

angular.module('fulfillflowApp')
.controller('WarehouseCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.locations = [];
  $scope.heatmapData = [];

  $scope.loadLocations = function() {
    ApiService.get('/warehouse/locations')
      .then(function(response) {
        $scope.locations = response.data;
      });
  };

  $scope.loadHeatmap = function() {
    ApiService.get('/warehouse/heatmap')
      .then(function(response) {
        $scope.heatmapData = response.data;
      });
  };

  $scope.loadLocations();
  $scope.loadHeatmap();
}]);

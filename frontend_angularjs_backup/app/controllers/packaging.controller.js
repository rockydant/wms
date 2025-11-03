'use strict';

angular.module('fulfillflowApp')
.controller('PackagingCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.shipments = [];
  $scope.error = null;
  $scope.loading = false;

  $scope.loadShipments = function() {
    $scope.loading = true;
    ApiService.get('/packaging/ready')
      .then(function(response) {
        $scope.shipments = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load ready shipments';
        console.error('Error loading ready shipments:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  $scope.packageShipment = function(shipment) {
    if (!confirm('Are you sure you want to package and ship this shipment?')) {
      return;
    }

    $scope.loading = true;
    ApiService.patch('/packaging/' + shipment.id + '/package', {
      autoBookFreight: false
    })
      .then(function(response) {
        $scope.loadShipments();
        alert('Shipment packaged successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to package shipment';
        console.error('Error packaging shipment:', error);
        alert('Failed to package shipment: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  $scope.loadShipments();
}]);

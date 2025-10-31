'use strict';

angular.module('fulfillflowApp')
.controller('PackagingCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.shipments = [];

  $scope.loadShipments = function() {
    ApiService.get('/packaging/ready')
      .then(function(response) {
        $scope.shipments = response.data;
      });
  };

  $scope.packageShipment = function(shipmentId) {
    ApiService.patch('/packaging/' + shipmentId + '/package')
      .then(function() {
        alert('Shipment packaged successfully!');
        $scope.loadShipments();
      });
  };

  $scope.loadShipments();
}]);

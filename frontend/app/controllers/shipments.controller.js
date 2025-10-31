'use strict';

angular.module('fulfillflowApp')
.controller('ShipmentsCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.shipments = [];

  $scope.loadShipments = function() {
    ApiService.get('/shipments')
      .then(function(response) {
        $scope.shipments = response.data;
      });
  };

  $scope.loadShipments();
}]);

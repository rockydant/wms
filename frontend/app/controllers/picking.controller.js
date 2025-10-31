'use strict';

angular.module('fulfillflowApp')
.controller('PickingCtrl', ['$scope', 'ApiService', function($scope, ApiService) {
  $scope.orderQueues = [];

  $scope.loadQueues = function() {
    ApiService.get('/picking/queues')
      .then(function(response) {
        $scope.orderQueues = response.data;
      });
  };

  $scope.loadQueues();
}]);

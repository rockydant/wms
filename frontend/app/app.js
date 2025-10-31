'use strict';

angular.module('fulfillflowApp', [
  'ngRoute',
  'ngResource',
  'ngCookies',
  'ngSanitize',
  'ngTouch'
])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardCtrl'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'LoginCtrl'
    })
    .when('/customers', {
      templateUrl: 'views/customers/list.html',
      controller: 'CustomersCtrl'
    })
    .when('/shipments', {
      templateUrl: 'views/shipments/list.html',
      controller: 'ShipmentsCtrl'
    })
    .when('/inventory', {
      templateUrl: 'views/inventory/list.html',
      controller: 'InventoryCtrl'
    })
    .when('/receiving', {
      templateUrl: 'views/receiving/list.html',
      controller: 'ReceivingCtrl'
    })
    .when('/picking', {
      templateUrl: 'views/picking/list.html',
      controller: 'PickingCtrl'
    })
    .when('/qc', {
      templateUrl: 'views/qc/list.html',
      controller: 'QcCtrl'
    })
    .when('/packaging', {
      templateUrl: 'views/packaging/list.html',
      controller: 'PackagingCtrl'
    })
    .when('/warehouse', {
      templateUrl: 'views/warehouse/list.html',
      controller: 'WarehouseCtrl'
    })
    .when('/reports', {
      templateUrl: 'views/reports/list.html',
      controller: 'ReportsCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}])
.run(['$rootScope', '$location', 'AuthService', function($rootScope, $location, AuthService) {
  $rootScope.$on('$routeChangeStart', function(event, next, current) {
    if (!AuthService.isAuthenticated() && next.templateUrl !== 'views/login.html') {
      $location.path('/login');
    }
  });
}]);

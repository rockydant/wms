'use strict';

angular.module('fulfillflowApp')
.service('ApiService', ['$http', 'AuthService', function($http, AuthService) {
  const API_URL = 'http://localhost:3000/api/v1';

  function getHeaders() {
    const token = AuthService.getToken();
    return {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };
  }

  this.get = function(endpoint) {
    return $http.get(API_URL + endpoint, { headers: getHeaders() });
  };

  this.post = function(endpoint, data) {
    return $http.post(API_URL + endpoint, data, { headers: getHeaders() });
  };

  this.patch = function(endpoint, data) {
    return $http.patch(API_URL + endpoint, data, { headers: getHeaders() });
  };

  this.delete = function(endpoint) {
    return $http.delete(API_URL + endpoint, { headers: getHeaders() });
  };
}]);

'use strict';

angular.module('fulfillflowApp')
.service('AuthService', ['$http', '$cookies', '$q', function($http, $cookies, $q) {
  const API_URL = 'http://localhost:3000/api/v1';

  this.login = function(credentials) {
    const deferred = $q.defer();
    
    $http.post(API_URL + '/auth/login', credentials)
      .then(function(response) {
        $cookies.put('access_token', response.data.access_token);
        $cookies.put('user', JSON.stringify(response.data.user));
        deferred.resolve(response.data);
      })
      .catch(function(error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };

  this.logout = function() {
    $cookies.remove('access_token');
    $cookies.remove('user');
  };

  this.isAuthenticated = function() {
    return !!$cookies.get('access_token');
  };

  this.getCurrentUser = function() {
    const userStr = $cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  this.getToken = function() {
    return $cookies.get('access_token');
  };
}]);

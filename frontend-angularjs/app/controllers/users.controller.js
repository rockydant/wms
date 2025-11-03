'use strict';

angular.module('fulfillflowApp')
.controller('UsersCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.users = [];
  $scope.customers = [];
  $scope.showCreateForm = false;
  $scope.showEditForm = false;
  $scope.error = null;
  $scope.loading = false;

  // Available roles
  $scope.roles = [
    'Super Admin',
    'Inventory Leader',
    'Receiving',
    'Picking',
    'Delivery Leader',
    'QC',
    'Packaging',
    'Customer'
  ];

  // Form data
  $scope.newUser = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Picking',
    customerId: ''
  };

  $scope.editingUser = null;

  // Load data
  $scope.loadData = function() {
    $scope.loading = true;
    return $q.all([
      ApiService.get('/users'),
      ApiService.get('/customers')
    ]).then(function(results) {
      $scope.users = results[0].data;
      $scope.customers = results[1].data;
    }).catch(function(error) {
      $scope.error = error.data?.message || 'Failed to load data';
      console.error('Error loading data:', error);
    }).finally(function() {
      $scope.loading = false;
    });
  };

  // Show create form
  $scope.showCreate = function() {
    $scope.showCreateForm = true;
    $scope.showEditForm = false;
    $scope.newUser = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Picking',
      customerId: ''
    };
    $scope.error = null;
  };

  // Show edit form
  $scope.showEdit = function(user) {
    $scope.showEditForm = true;
    $scope.showCreateForm = false;
    $scope.editingUser = angular.copy(user);
    // Don't include password in edit
    $scope.editingUser.password = '';
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showCreateForm = false;
    $scope.showEditForm = false;
    $scope.editingUser = null;
    $scope.error = null;
  };

  // Create user
  $scope.createUser = function() {
    if (!$scope.newUser.email || !$scope.newUser.password || !$scope.newUser.firstName || !$scope.newUser.lastName) {
      $scope.error = 'Email, Password, First Name, and Last Name are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    // Only include customerId if selected
    var userData = angular.copy($scope.newUser);
    if (!userData.customerId) {
      delete userData.customerId;
    }

    ApiService.post('/users', userData)
      .then(function(response) {
        $scope.users.push(response.data);
        $scope.cancelForm();
        alert('User created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create user';
        console.error('Error creating user:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Update user
  $scope.updateUser = function() {
    if (!$scope.editingUser.email || !$scope.editingUser.firstName || !$scope.editingUser.lastName) {
      $scope.error = 'Email, First Name, and Last Name are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    var updateData = {
      email: $scope.editingUser.email,
      firstName: $scope.editingUser.firstName,
      lastName: $scope.editingUser.lastName,
      role: $scope.editingUser.role,
      customerId: $scope.editingUser.customerId
    };

    // Only include password if it was changed
    if ($scope.editingUser.password && $scope.editingUser.password.length > 0) {
      updateData.password = $scope.editingUser.password;
    }

    ApiService.patch('/users/' + $scope.editingUser.id, updateData)
      .then(function(response) {
        // Update the user in the list
        var index = $scope.users.findIndex(function(u) {
          return u.id === $scope.editingUser.id;
        });
        if (index !== -1) {
          $scope.users[index] = response.data;
        }
        $scope.cancelForm();
        alert('User updated successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update user';
        console.error('Error updating user:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Delete user
  $scope.deleteUser = function(user) {
    if (!confirm('Are you sure you want to delete user ' + user.email + '?')) {
      return;
    }

    $scope.loading = true;
    ApiService.delete('/users/' + user.id)
      .then(function() {
        $scope.users = $scope.users.filter(function(u) {
          return u.id !== user.id;
        });
        alert('User deleted successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to delete user';
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Toggle user active status
  $scope.toggleActive = function(user) {
    var updateData = {
      isActive: !user.isActive
    };

    $scope.loading = true;
    ApiService.patch('/users/' + user.id, updateData)
      .then(function(response) {
        user.isActive = response.data.isActive;
        alert('User status updated!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update user status';
        console.error('Error updating user status:', error);
        alert('Failed to update user status: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadData();
}]);


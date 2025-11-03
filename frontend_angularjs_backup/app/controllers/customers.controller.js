'use strict';

angular.module('fulfillflowApp')
.controller('CustomersCtrl', ['$scope', 'ApiService', '$q', function($scope, ApiService, $q) {
  $scope.customers = [];
  $scope.showCreateForm = false;
  $scope.showEditForm = false;
  $scope.error = null;
  $scope.loading = false;

  // Form data
  $scope.newCustomer = {
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  };

  $scope.editingCustomer = null;

  // Load customers
  $scope.loadCustomers = function() {
    $scope.loading = true;
    ApiService.get('/customers')
      .then(function(response) {
        $scope.customers = response.data;
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to load customers';
        console.error('Error loading customers:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Show create form
  $scope.showCreate = function() {
    $scope.showCreateForm = true;
    $scope.showEditForm = false;
    $scope.newCustomer = {
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: ''
    };
    $scope.error = null;
  };

  // Show edit form
  $scope.showEdit = function(customer) {
    $scope.showEditForm = true;
    $scope.showCreateForm = false;
    $scope.editingCustomer = angular.copy(customer);
    $scope.error = null;
  };

  // Cancel form
  $scope.cancelForm = function() {
    $scope.showCreateForm = false;
    $scope.showEditForm = false;
    $scope.editingCustomer = null;
    $scope.error = null;
  };

  // Create customer
  $scope.createCustomer = function() {
    if (!$scope.newCustomer.name || !$scope.newCustomer.contactEmail) {
      $scope.error = 'Name and email are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.post('/customers', $scope.newCustomer)
      .then(function(response) {
        $scope.customers.push(response.data);
        $scope.cancelForm();
        alert('Customer created successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to create customer';
        console.error('Error creating customer:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Update customer
  $scope.updateCustomer = function() {
    if (!$scope.editingCustomer.name || !$scope.editingCustomer.contactEmail) {
      $scope.error = 'Name and email are required';
      return;
    }

    $scope.loading = true;
    $scope.error = null;

    ApiService.patch('/customers/' + $scope.editingCustomer.id, $scope.editingCustomer)
      .then(function(response) {
        // Update the customer in the list
        var index = $scope.customers.findIndex(function(c) {
          return c.id === $scope.editingCustomer.id;
        });
        if (index !== -1) {
          $scope.customers[index] = response.data;
        }
        $scope.cancelForm();
        alert('Customer updated successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update customer';
        console.error('Error updating customer:', error);
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Delete customer
  $scope.deleteCustomer = function(customer) {
    if (!confirm('Are you sure you want to delete ' + customer.name + '?')) {
      return;
    }

    $scope.loading = true;
    ApiService.delete('/customers/' + customer.id)
      .then(function() {
        $scope.customers = $scope.customers.filter(function(c) {
          return c.id !== customer.id;
        });
        alert('Customer deleted successfully!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to delete customer';
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Toggle customer active status
  $scope.toggleActive = function(customer) {
    var updateData = {
      isActive: !customer.isActive
    };

    $scope.loading = true;
    ApiService.patch('/customers/' + customer.id, updateData)
      .then(function(response) {
        customer.isActive = response.data.isActive;
        alert('Customer status updated!');
      })
      .catch(function(error) {
        $scope.error = error.data?.message || 'Failed to update customer status';
        console.error('Error updating customer status:', error);
        alert('Failed to update customer status: ' + ($scope.error || 'Unknown error'));
      })
      .finally(function() {
        $scope.loading = false;
      });
  };

  // Initialize
  $scope.loadCustomers();
}]);

'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('HeaderCtrl', ['$scope', '$state', '$location','localStorageService','$rootScope','AuthFactory',
  function ($scope, $state, $location, localStorageService, $rootScope,AuthFactory) {

    $scope.logout = function() {

        localStorageService.clearAll();
        $rootScope.currentUserId = null;
        $rootScope.currentUserName = null;
        $rootScope.currentUserRole = null;
        $rootScope.isAdmin = null;
        $rootScope.isAuthenticated = null;        

        AuthFactory.logout()//logout - delete token from server
        .then(function(response) {
          },
        function(error) {
          //$scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
          //window.alert("AuthFactory: не могу осуществить выход из системы");
        });

        $location.path('/login');

    };

    $scope.stateReload = function() {//reloads current state
        $state.reload();
    };
    
    $scope.isCurrentUserAnAdmin = $rootScope.isAdmin;
    $scope.isCollapsed = true;
    $scope.collapse = function(){
        $scope.isCollapsed = !$scope.isCollapsed;        
    };

  }]);
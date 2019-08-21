'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('LoginCtrl', ['$scope', '$state', 'AuthFactory', '$location','$rootScope','staffFactory','localStorageService','msgService','$window',
    function ($scope, $state, AuthFactory, $location,$rootScope,staffFactory,localStorageService,msgService,$window) {

      $scope.login = function () {      
      AuthFactory.login(this.username, this.password)//trying fetch date and time from server
      .then(function(response) {
          var response_obj = response.data;//token from server
          var token = response_obj.token;
          var current_user = response_obj.current_user;
          console.log('token from server',token);
          console.log('current_user',current_user);
          $rootScope.currentUserId = current_user.id;
          $rootScope.currentUserName = current_user.username;
          $rootScope.currentUserRole = current_user.role;
          $rootScope.isAdmin = current_user.isAdmin;
          $rootScope.isAuthenticated = true;
          localStorageService.clearAll();

          if(localStorageService.isSupported) { //save user details to local storage
            localStorageService.set("token", token);
            localStorageService.set("currentUserId", current_user.id);
            localStorageService.set("currentUserName", current_user.username);
            localStorageService.set("currentUserRole", current_user.role);
            localStorageService.set("isAdmin", current_user.isAdmin);
            localStorageService.set("isAuthenticated", true);
            console.log('token saved to localStorage',token);            
          };

          $window.location.reload();
          $location.path('/');
      },
      function(error) {
          //console.log("cannot get token",error);
          window.alert(msgService.getMsg("cannotLogin"));
      });
    };    

    $scope.cancelLogin = function () {
        $scope.username = "";
        $scope.password = "";        
    };

  }]);
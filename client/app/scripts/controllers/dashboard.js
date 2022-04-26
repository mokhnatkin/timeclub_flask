'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('DashboardCtrl', ['$scope','guestCompute','promotionFactory','$rootScope','msgService','serverTimeFactory','guestsOutStatFactory','guestsHistoryStatFactory',
  function ($scope,guestCompute,promotionFactory,$rootScope,msgService,serverTimeFactory,guestsOutStatFactory,guestsHistoryStatFactory) {
    $scope.showInfo = false;
    $scope.message = msgService.getMsg("loadingInProgress");
    $scope.guestsModified = [];  
    var currentTimeServer;
 

    serverTimeFactory.getItem()//trying fetch date and time from server
        .then(function(response) {
            currentTimeServer = response.data;//date&time from server
            $scope.startDateToday = new Date(currentTimeServer.currentDateTime);
            $scope.endDate = $scope.startDateToday;
            $scope.doDBFetch();
        },
        function(error) {      
            $scope.startDateToday = new Date();//if fails, use local machine date & time
            $scope.endDate = $scope.startDateToday;
            $scope.doDBFetch();
            console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));          
        });



    $scope.doDBFetch = function(){//fetch data after time is obtained from server
        $scope.startDate = guestCompute.computeStartDateThisDay($scope.startDateToday,$rootScope.currentUserRole);
        $scope.startDate2 = guestCompute.computeStartDateThisMonth($scope.startDateToday);
        
        guestsOutStatFactory.getItems()
                .then(function(response){
                    $scope.outStatNow = response.data;
                    $scope.showInfo = true;
                },
                    function(error) {
                    console.log('Cannot compute guests stat')
                });

        guestsHistoryStatFactory.getItems($scope.startDate.toISOString(),$scope.endDate.toISOString())
              .then(function(response) {
                $scope.outStatToday = response.data;
                $scope.showClients = true;
                $scope.search = '';
                },
              function(response) {
                $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
              });

        guestsHistoryStatFactory.getItems($scope.startDate2.toISOString(),$scope.endDate.toISOString())
              .then(function(response) {
                $scope.outStatMonth = response.data;
                $scope.showClients = true;
                $scope.search = '';
                },
              function(response) {
                $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
              });

    };

  }]);

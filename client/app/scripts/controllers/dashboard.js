'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('DashboardCtrl', ['$scope','guestFactory','guestCompute','clientFactoryFiltered','promotionFactory','$rootScope','msgService','serverTimeFactory','guestsOutStatFactory',
  function ($scope,guestFactory,guestCompute,clientFactoryFiltered,promotionFactory,$rootScope,msgService,serverTimeFactory,guestsOutStatFactory) {
    $scope.showInfo = false;
    $scope.message = msgService.getMsg("loadingInProgress");
    $scope.guestsModified = [];  
    var currentTimeServer;
 

    serverTimeFactory.getItem()//trying fetch date and time from server
        .then(function(response) {
            currentTimeServer = response.data;//date&time from server  
            //currentTimeServerDDTT = currentTimeServer.currentDateTime;          
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
        
        guestFactory.getItems()//stat for Now in the club
            .then(function(response) {
                $scope.guests = response.data;
                $scope.showInfo = true;
                promotionFactory.getItems()
                    .then(function(response) {
                        $scope.promotions = response.data;
                        $scope.guestsModified = guestCompute.modifyGuestArr($scope.guests,$scope.promotions,$scope.endDate);
                        //$scope.outStatNow = guestCompute.computeGuestStat($scope.guestsModified);
                        guestsOutStatFactory.getItems()
                            .then(function(response){
                                $scope.outStatNow = response.data;
                            },
                            function(error) {
                            console.log('Cannot compute guests stat')
                        });                        
                    },
                        function(error) {console.log("promotionFactory: "+msgService.getMsg("cannotQueryData"));}
                    );
                },
            function(error) {
                $scope.message = response.status + " " + response.statusText;
                window.alert(msgService.getMsg("cannotQueryData")+$scope.message);
            });

        clientFactoryFiltered.getItems($scope.startDate.toISOString(),$scope.endDate.toISOString())//stat for club today
            .then(function(response) {
                $scope.clients = response.data;
                $scope.outStatToday = guestCompute.computeGuestStat($scope.clients);
            },
                function(response) {
                    $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
            });
                    
        clientFactoryFiltered.getItems($scope.startDate2.toISOString(),$scope.endDate.toISOString())
            .then(function(response) {
                $scope.clients2 = response.data;
                $scope.outStatMonth = guestCompute.computeGuestStat($scope.clients2);
            },
                function(response) {
                    $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
            });
    };

  }]);

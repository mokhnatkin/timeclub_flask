'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:StatCtrl
 * @description
 * # StatCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('StatCtrl', ['$scope','guestCompute','clientFactoryFiltered','promotionFactory','$rootScope','msgService','textConsts','serverTimeFactory',
  function ($scope,guestCompute,clientFactoryFiltered,promotionFactory,$rootScope,msgService,textConsts,serverTimeFactory) {
    $scope.showInfo = false;
    $scope.showMessage = false;
    $scope.message = msgService.getMsg("loadingInProgress");
    var freeGuestsN, paidGuestsN, promoGuestsN, freeGuestsS, paidGuestsS, promoGuestsS;

    ///////////////////////////////////////////////////////
    var currentTimeServer;
    serverTimeFactory.getItem()//trying fetch date and time from server
      .then(function(response) {
          currentTimeServer = response.data;//date&time from server
          $scope.startDateToday = new Date(currentTimeServer.currentDateTime);
          $scope.endDate = $scope.startDateToday;
          $scope.maxDate = $scope.startDateToday;
          $scope.startDate = guestCompute.computeStartDateThisMonth($scope.startDateToday);
          $scope.getDatesAndFetchClients($scope.startDate,$scope.endDate);
      },
      function(error) {
          $scope.startDateToday = new Date();//if fails, use local machine date & time
          $scope.endDate = $scope.startDateToday;
          $scope.maxDate = $scope.startDateToday;
          $scope.startDate = guestCompute.computeStartDateThisMonth($scope.startDateToday);
          $scope.getDatesAndFetchClients($scope.startDate,$scope.endDate);
          console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));          
      });

    ///////////////////////////////////////////////////////    

    $scope.getDatesAndFetchClients = function(startDate,endDate){
      if(endDate<startDate){
          window.alert(msgService.getMsg("validateDatesBegEnd"));
        } else {
          $scope.showMessage = true;         
              promotionFactory.getItems()
                .then(function(response) {
                  $scope.promotions = response.data;                 
                  clientFactoryFiltered.getItems($scope.startDate.toISOString(),$scope.endDate.toISOString())//stat for club this month
                    .then(function(response) {
                      $scope.clients = response.data;                      
                      $scope.outStat = guestCompute.computeClientStat($scope.clients,$scope.promotions);
                      $scope.showMessage = false;
                      $scope.showInfo = true;
                      for (var i = 0; i < $scope.outStat.length; i++){//lets compute figures for charts
                        if($scope.outStat[i].category=="------бесплатные"){
                          freeGuestsN = $scope.outStat[i].n;
                          freeGuestsS = $scope.outStat[i].sum;                          
                        };
                        if($scope.outStat[i].category=="--------стандарт (10 тг. минута)"){
                          paidGuestsN = $scope.outStat[i].n;
                          paidGuestsS = $scope.outStat[i].sum;                          
                        };
                        if($scope.outStat[i].category=="--------акции"){
                          promoGuestsN = $scope.outStat[i].n;
                          promoGuestsS = $scope.outStat[i].sum;                          
                        };
                      };//end for
                      $scope.chartGuestsOptions = {//guests per category
                        data: [
                          {
                            freeGuests: freeGuestsN,
                            paidGuests: paidGuestsN,
                            promoGuests: promoGuestsN
                          }
                        ],     
                        dimensions: {
                          freeGuests: {
                            name: 'Бесплатные гости',
                            type: 'bar'
                          },
                          paidGuests: {
                            name: 'Платные гости',          
                            type: 'bar'
                          },
                          promoGuests: {
                            name: 'По акции',          
                            type: 'bar'
                          }                
                        }
                      };                  
                      $scope.chartAmountsOptions = {//amounts per category
                        data: [
                          {
                            freeGuests: freeGuestsS,
                            paidGuests: paidGuestsS,
                            promoGuests: promoGuestsS
                          }
                        ],    
                        dimensions: {
                          freeGuests: {
                            name: 'Бесплатные гости',
                            type: 'bar'
                          },
                          paidGuests: {
                            name: 'Платные гости',          
                            type: 'bar'
                          },
                          promoGuests: {
                            name: 'По акции',          
                            type: 'bar'
                          }                
                        }
                      };                      
                    },
                    function(error) {
                      $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
                    });
                },
                function(response) {
                  console.log("promotionFactory: "+msgService.getMsg("cannotQueryData"));
                });
        };
    };
   
    //calendar settings from textConsts service
    $scope.hourStep = textConsts.getCalendarSetting("hourStep");
    $scope.minuteStep = textConsts.getCalendarSetting("minuteStep");
    $scope.format = textConsts.getCalendarSetting("format");
    $scope.dateOptions = {
      showWeeks: textConsts.getCalendarSetting("showWeeks"),
      startingDay: textConsts.getCalendarSetting("startingDay")
    };

}]);
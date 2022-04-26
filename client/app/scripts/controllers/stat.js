'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:StatCtrl
 * @description
 * # StatCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('StatCtrl', ['$scope','guestCompute','clientFactoryFiltered','promotionFactory','$rootScope','msgService','textConsts','serverTimeFactory','guestsHistoryFullStatFactory',
  function ($scope,guestCompute,clientFactoryFiltered,promotionFactory,$rootScope,msgService,textConsts,serverTimeFactory,guestsHistoryFullStatFactory) {
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
          guestsHistoryFullStatFactory.getItems(startDate.toISOString(),endDate.toISOString())
            .then(function(response) {
                $scope.outStat = response.data;
                //console.log($scope.outStat);
                $scope.showInfo = true;
                $scope.showMessage = false;

                for (var i = 0; i < $scope.outStat.length; i++){//lets compute figures for charts
                  if($scope.outStat[i].name=="------бесплатные гости"){
                    freeGuestsN = $scope.outStat[i].total_people;
                    freeGuestsS = $scope.outStat[i].amount;
                  };
                  if($scope.outStat[i].name=="--------стандарт (не по акции)"){
                    paidGuestsN = $scope.outStat[i].total_people;
                    paidGuestsS = $scope.outStat[i].amount;
                  };
                  if($scope.outStat[i].name=="--------акции"){
                    promoGuestsN = $scope.outStat[i].total_people;
                    promoGuestsS = $scope.outStat[i].amount;
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
            function(response) {
              $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
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
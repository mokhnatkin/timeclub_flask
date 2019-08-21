'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:EmplWagesCtrl
 * @description
 * # EmplWagesCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('EmplWagesCtrl', ['$scope','guestCompute','$state','msgService','textConsts','convertMMtoDDHHMM','employeeWagesFactory','rowColorsGuests','guestFilterFactory','serverTimeFactory',
  function ($scope,guestCompute,$state,msgService,textConsts,convertMMtoDDHHMM,employeeWagesFactory,rowColorsGuests,guestFilterFactory,serverTimeFactory) {
    $scope.showClients = false;//show / hide table with clients
    $scope.message = msgService.getMsg("loadingInProgress");  
    var N; //total nubmer of employees displayed
    const adminWagePerHour = textConsts.getConstValueByName("adminWagePerHour");
    
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

    $scope.getDatesAndFetchClients = function(startDate,endDate){
        if(endDate<startDate){
            window.alert(msgService.getMsg("validateDatesBegEnd"));
          } else {
            employeeWagesFactory.getItems(startDate.toISOString(),endDate.toISOString())
              .then(function(response) {
                $scope.clients = response.data;
                N = $scope.clients.length;
                $scope.showClients = true;
                $scope.search = '';
                },
              function(response) {
                $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
              });
          };
      };

    $scope.setRowBackgroud = function(isEmployeeAtWork){//set background color to row depending on free guest att and promotion
      var rowClass;
      rowClass = rowColorsGuests.setRowColorEmpl(isEmployeeAtWork);
      return rowClass;
    };

    $scope.convertMinutes = function(minutes){//convert timeinClub (minutes) into dd, hh, mm
      var res = convertMMtoDDHHMM.convertMinutes(minutes);
      return res;
    };

    $scope.search = '';
    $scope.searchNameAndCompany = function(item){//custom filter: uses guest name and company name to filter
      var res;
      res = guestFilterFactory.searchGuestNameAndCompany(item,$scope.search);       
      return res;
    };

    $scope.computeWage = function(minutes,isEmployeeAtWork){//employee's wage
      var res;
      if(isEmployeeAtWork){
          res = Math.floor(minutes*adminWagePerHour/60);
        } else {res = 0;};      
      return res;
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
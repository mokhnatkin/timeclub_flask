'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:CheckoutDetailsCtrl
 * @description
 * # CheckoutDetailsCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('CheckoutDetailsCtrl', ['$scope','checkoutFactory','$state','$interval','msgService','convertMMtoDDHHMM',
  function ($scope,checkoutFactory,$state,$interval,msgService,convertMMtoDDHHMM) {    
       
    $scope.showCheckouts = function(){
      var N;
      $scope.showInfo = false;
      checkoutFactory.query(  //fetch guests from the REST server
        function(response) {
          $scope.guestsToCheckout = response; //all guests are now in this array        
          N = $scope.guestsToCheckout.length;
          if (N > 0) {
            $scope.showInfo = true;
          };
          $scope.totalN = N;
          $scope.amountCheckout = 0;
          for (var i = 0; i < N; i++){
              $scope.amountCheckout = $scope.amountCheckout + $scope.guestsToCheckout[i].amount;                 
            };
          },
        function(response) {
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
        });
    };

    $scope.convertMinutes = function(minutes){//convert timeinClub (minutes) into dd, hh, mm
      var res = convertMMtoDDHHMM.convertMinutes(minutes);
      return res;
    };

    $interval( function(){ $scope.showCheckouts(); }, 7000);//update page at a given interval in millisec
}]);
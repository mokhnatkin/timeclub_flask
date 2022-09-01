'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:CheckoutCtrl
 * @description
 * # CheckoutCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('CheckoutCtrl', ['$scope','checkoutService','clientFactory','guestCompute','promotionFactory','$state','$timeout','msgService','convertMMtoDDHHMM',
  function ($scope,checkoutService,clientFactory,guestCompute,promotionFactory,$state,$timeout,msgService,convertMMtoDDHHMM) {
    var N, checkoutDateTime;
    $scope.isPaidButtonActive = false;

    promotionFactory.getItems()
        .then(function(response) {          
          $scope.promotions = response.data;
          $scope.guestsToCheckout = checkoutService.fetchArr();
          checkoutDateTime = checkoutService.fetchDateTime();
          N = $scope.guestsToCheckout.length;
          $scope.totalN = N;
          //$scope.guestsToCheckout = guestCompute.modifyGuestArr($scope.guestsToCheckout,$scope.promotions,checkoutDateTime);
          $scope.amountCheckout = 0;
          for (var i = 0; i < N; i++){
              clientFactory.computeItem($scope.guestsToCheckout[i])
              .then(function (response) {                
                  //$state.reload();
              }, function (error) {
                  console.log('Cannot compute time & amount per guest:'+ error.message);                
              });              
              $scope.amountCheckout = $scope.amountCheckout + $scope.guestsToCheckout[i].amount;
              $scope.guestsToCheckout[i].checkoutTime = checkoutDateTime;        
          };          

        },
        function(response) {console.log("promotionFactory: "+msgService.getMsg("cannotQueryData"));}
    );


    $scope.checkoutGuests = function(){
        for (var i = 0; i < N; i++){//for each guest to check out - save to History
            $scope.guestsToCheckout[i].isActive = false;
            $scope.guestsToCheckout[i].isChecked = false;
            $scope.guestsToCheckout[i].isOpen = false;

            clientFactory.updateItem($scope.guestsToCheckout[i])
            .then(function (response) {                
                //$state.reload();
            }, function (error) {
                console.log('Item cannot be updated:'+ error.message);                
            });
        }; //end of FOR loop
        $scope.isPaidButtonActive = true;
    };

    $scope.cancelCheckoutGuests = function(){        
        $state.go("app", {}, { reload: true });
    };

    $scope.closeCheckoutWindow = function(){
    //close the dialog window        
        $state.go("app", {}, { reload: true });
    };

    $scope.convertMinutes = function(minutes){//convert timeinClub (minutes) into dd, hh, mm
        var res = convertMMtoDDHHMM.convertMinutes(minutes);
        return res;
    };

    $scope.defineBtnClass = function(isChecked){//change button class based on isChecked attr
        var btnClass = "btn btn-default";
        if (isChecked){
            btnClass = "btn btn-default";
        } else {
            btnClass = "btn btn-success";
        }        
        return btnClass;
    };

    $scope.defineBtnTxt = function(isChecked){//change button class based on isChecked attr
        var btnTxt = "Нет";
        if (isChecked){
            btnTxt = "Нет";
        } else {
            btnTxt = "Да";
        }        
        return btnTxt;
    };
}]);
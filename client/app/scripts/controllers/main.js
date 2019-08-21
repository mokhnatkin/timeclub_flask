'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('MainCtrl', ['$scope','guestFactory','guestCompute', 'clientFactory','activePromotionFactory','$state','promoDetails','rowColorsGuests','checkoutService', 'msgService','convertMMtoDDHHMM','guestFilterFactory','emplFactory','textConsts','serverTimeFactory',
  function ($scope, guestFactory, guestCompute, clientFactory, activePromotionFactory, $state, promoDetails, rowColorsGuests, checkoutService, msgService,convertMMtoDDHHMM,guestFilterFactory,emplFactory,textConsts,serverTimeFactory) {
    //var token = get_token_from_local_storage.get_token();
    //console.log('MainCtrl token from local storage',token)
    $scope.showGuests = false;//show / hide table with guests
    $scope.message = msgService.getMsg("loadingInProgress");
    var N, Npromo;
    $scope.showAddGuestModal = true;
    $scope.showAddGroupTable = false;
    $scope.showChangeButton = true;
    $scope.showCloseButton = true;
    $scope.showAddGroupModule = true;
    $scope.newGuests = [];//add group of guests
    var companiesMaxNum = textConsts.getConstValueByName("companiesMaxNum");//max number of companies (groups)
    $scope.companies = [];
    for (var j = 0; j < companiesMaxNum; j++){
      $scope.companies[j] = j+1;//company number - for groups
    };
    var selectedCompanyN;
    var currentTimeServer, currentDateTime;

    ///////////////////////////////////////////////////////
    $scope.promotions = [];

    activePromotionFactory.getItems()
    .then(function (response) {
        $scope.promotions = response.data;
        Npromo = $scope.promotions.length;
        guestFactory.getItems()//fetch guests from the REST server
          .then(function(response) {
            $scope.guests = response.data; //all guests are now in this array: $scope.guests
            N = $scope.guests.length;
            serverTimeFactory.getItem()//trying fetch date and time from server
              .then(function(response) {
                  currentTimeServer = response.data;//date&time from server
                  //console.log('currentTimeServer',currentTimeServer)
                  currentDateTime = new Date(currentTimeServer.currentDateTime);
                  $scope.currentTimeToShow = currentDateTime;
                  //console.log('currentDateTime',currentDateTime);
                  $scope.guests = guestCompute.modifyGuestArr($scope.guests,$scope.promotions,currentDateTime);
                  $scope.outStatNow = guestCompute.computeGuestStat($scope.guests);
                  $scope.showGuests = true;
              },
              function(error) {
                  currentDateTime = new Date();//if fails, use local machine date & time
                  $scope.currentTimeToShow = currentDateTime;
                  $scope.guests = guestCompute.modifyGuestArr($scope.guests,$scope.promotions,currentDateTime);
                  $scope.outStatNow = guestCompute.computeGuestStat($scope.guests);
                  $scope.showGuests = true;
                  console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));
              });
            },
          function(error) {
            $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
          });        
    }, function (error) {
        console.log("activePromotionFactory: "+msgService.getMsg("cannotQueryData"));
    }); 

    ///////////////////////////////////////////////////////

    $scope.employees = [];
    emplFactory.getItems()//fetch employees from the REST server
        .then(function(response) {
          $scope.employees = response.data;
          },
        function(error) {
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
          window.alert("emplFactory: "+msgService.getMsg("cannotQueryData"));
        });

    ///////////////////////////////////////////////////////

    $scope.getPromoNameById = function(promoId){//returns promo name
      var promoName;
      promoName = promoDetails.getNameById(promoId,$scope.promotions);
      return promoName;
    };

    $scope.setRowBackgroud = function(isFree,promotion,isEmployee){//set background color to row depending on free guest att and promotion
      var rowClass;
      rowClass = rowColorsGuests.setRowColor(isFree,promotion,isEmployee);
      return rowClass;
    };

    $scope.removePromoIfFree = function(isFree,promotion){//if isFree checked, then remove promo id
      var newPromo;
      if(isFree){
        newPromo = null;
      } else {newPromo = promotion;};
      return newPromo;
    };

    $scope.disableIsFreeAD = [];
    $scope.disablePromoSelectAD = [];
    $scope.disableIsFreeED = false;
    $scope.disablePromoSelectED = true;

    $scope.changeIsFreeFlagByPromo = function(guestPromoId,type,guestIndex){
      //if Birthday or any promo with 0 fix amount, then activate is Free flag
      var result = false;
      var isBirthday = guestCompute.isSelectedPromoBirthday(guestPromoId,$scope.promotions);
      if (isBirthday){
        if (type == "AD"){
          $scope.disableIsFreeAD[guestIndex] = true;
          $scope.disablePromoSelectAD[guestIndex] = false;
        } else if (type == "ED"){
          $scope.disableIsFreeED = true;
          $scope.disablePromoSelectED = false;
        };
        result = true;
      } else {
        if (type == "AD"){
          $scope.disableIsFreeAD[guestIndex] = false;
          $scope.disablePromoSelectAD[guestIndex] = true;
        } else if (type == "ED"){
          $scope.disableIsFreeED = false;
          $scope.disablePromoSelectED = true;
        };
        result = false;
      };
      return result;
    };

    $scope.changeDefCompanyN = function(selVal){//change default N of company when adding group
      selectedCompanyN = selVal;
    };

    ///////////////////////////////////////////////////////


    $scope.addOneGuestToGroup = function(){//add guest into group
      var newGuestsLen = $scope.newGuests.length;
      $scope.newGuests.push({});
      $scope.newGuests[newGuestsLen].guestIndex = newGuestsLen;
      $scope.newGuests[newGuestsLen].companyN = selectedCompanyN;
      $scope.disableIsFreeAD.push(false);
      $scope.disablePromoSelectAD.push(true);
    };
    
    $scope.fillGroupInfo = function(){ //add group of guests
      $scope.addOneGuestToGroup();//add first guest
      $scope.showAddGroupTable = true;
      $scope.showAddGuestModal = false;
      $scope.showChangeButton = false;
      $scope.showCloseButton = false;
    };

    $scope.cancelFillGroupInfo = function(){ //cancel - do not add group of guests
      $scope.showAddGroupTable = !$scope.showAddGroupTable;
      $scope.showAddGuestModal = !$scope.showAddGuestModal;
      $scope.showChangeButton = !$scope.showChangeButton;
      $scope.showCloseButton = !$scope.showCloseButton;
      $scope.newGuests = [];//empty newGuests array
      $scope.disableIsFreeAD = [];
      $scope.disablePromoSelectAD = [];
      selectedCompanyN = '';
    };

    $scope.removeOneGuestFromGroup = function(rowIndex){
      if ($scope.newGuests.length>1) {
        $scope.disableIsFreeAD.splice(rowIndex,1);
        $scope.disablePromoSelectAD.splice(rowIndex,1);
        $scope.newGuests.splice(rowIndex,1);
        //update guestIndex for each element in newGuests array
        for (var i = 0; i < $scope.newGuests.length; i++){
          $scope.newGuests[i].guestIndex = i;
        };
      } else {window.alert(msgService.getMsg("doNotRemoveFrstRow"))};
    };

    $scope.addGuest = function(newGuest){//add one new guest - post to DB via REST server

      newGuest = guestCompute.actualizateGuest(newGuest,$scope.promotions);
      clientFactory.createItem(newGuest)
        .then(function (response) {           
            $scope.showAddGuestModel = !$scope.showAddGuestModel;
            newGuest = {};
            $state.reload();
        }, function(error) {
            $scope.status = 'Unable to create item: ' + error.message;
            console.log($scope.status);
      });
    };//end of $scope.addGuest()


    $scope.putGroupIntoDB = function(){//post the group into DB - add each guest
      var allNames = true;
      var nGlen = $scope.newGuests.length;
      for (var i = 0; i < nGlen; i++){
        if ($scope.newGuests[i].name != undefined){
          allNames = allNames && true;
        } else {
          allNames = allNames && false;
        };
      };
      if (allNames) { //all guests has names
        for (i = 0; i < nGlen; i++) //save each guest to DB
          {$scope.addGuest($scope.newGuests[i]);};
      } else {
        window.alert(msgService.getMsg("needNamesForAllGuests"));
      };
    };

    ///////////////////////////////////////////////////////

    $scope.guestsToCheckout = [];
    $scope.showCheckoutModal = function(){ //do check out for selected guests
      var guestSelected = false;//is there any guest selected for check-out?
      var checkoutDateTime,currentTimeServer;
      for (var i = 0; i < N; i++){
        guestSelected = guestSelected || $scope.guests[i].isChecked;//is there any guest selected for check-out?
        if ($scope.guests[i].isChecked){
          $scope.guestsToCheckout.push($scope.guests[i]);//this array stores guests to check out
        };
      };
      if (guestSelected)//at least one guest is selected
      {
        serverTimeFactory.getItem()//trying fetch date and time from server
          .then(function(response) {
            currentTimeServer = response.data;
            checkoutDateTime = currentTimeServer.currentDateTime;//date&time from server
            checkoutService.saveArr($scope.guestsToCheckout,checkoutDateTime); //save data to Service, to be used by CheckoutCtrl
            $state.go("Modal.confirmClose");//load confirmation modal with table - list of guest to checkout
            },
          function(error) {
            checkoutDateTime = new Date();//if fails, use local machine date & time
            console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));
            checkoutService.saveArr($scope.guestsToCheckout,checkoutDateTime); //save data to Service, to be used by CheckoutCtrl
            $state.go("Modal.confirmClose");//load confirmation modal with table - list of guest to checkout
          });
        //all further (remove from guests, save to clients, etc.) is done in CheckoutCtrl
      } else {
        window.alert(msgService.getMsg("selectGuestToClose"));
      };
    };

    ///////////////////////////////////////////////////////
    $scope.guestToEdit = {};//empty object - guest to edit
    $scope.showEditGuestModal = false;

    $scope.cancelAddingGuest = function(){ //cancel Adding guest - clear fields and hide the modal
      $scope.newGuest = {};
    };

    $scope.editGuests = function(){//edit a guest in the club
      var guestSelected = false;//is there any guest selected for check-out?
      var countSelected = 0;
      for (var i = 0; i < N; i++){
        guestSelected = guestSelected || $scope.guests[i].isChecked;//is there any guest selected for check-out?
        if ($scope.guests[i].isChecked){
          countSelected++;//this array stores guests to check out
          $scope.guestToEdit = $scope.guests[i];
        };
      };
      var isBirthday;
      if (guestSelected) {//at least one guest is selected
        if (countSelected == 1){
          //show form to update guest
          $scope.showCloseButton = false;
          $scope.showAddGroupModule = false;
          $scope.showChangeButton = false;
          $scope.showAddGuestModal = false;
          isBirthday = guestCompute.isSelectedPromoBirthday($scope.guestToEdit.promotion,$scope.promotions);
          if(!isBirthday){
            $scope.disablePromoSelectED = true;
            $scope.disableIsFreeED = false;
          } else {
            $scope.disablePromoSelectED = false;
            $scope.disableIsFreeED = true;
          };
          $scope.showEditGuestModal = true;
          for (var j = 0; j < N; j++){
            $scope.guests[j].isChecked = false;
          };
          } else {window.alert(msgService.getMsg("selectJustOneRow"));}
        }
        else {window.alert(msgService.getMsg("selectTheRowToChange"));};
    };

    $scope.postChangesToGuest = function(){
      $scope.guestToEdit = guestCompute.actualizateGuest($scope.guestToEdit,$scope.promotions);
      clientFactory.updateItem($scope.guestToEdit)
      .then(function (response) {
          //console.log('Item updated');
          $scope.showAddGuestModal = true;
          $scope.showAddGroupModule = true;
          $scope.showCloseButton = true;
          $scope.showChangeButton = true;
          $state.reload();
      }, function (error) {
          console.log('Item cannot be updated:'+ error.message);                
      });
    };

    $scope.cancelEditingGuest = function(){
      //cancel - do not edit guest
      $scope.guestToEdit = {};
      $scope.showEditGuestModal = false;
      $scope.showAddGuestModal = true;
      $scope.showChangeButton = true;
      $state.reload();
    };

    ///////////////////////////////////////////////////////

    $scope.convertMinutes = function(minutes){//convert timeinClub (minutes) into dd, hh, mm
      var res = convertMMtoDDHHMM.convertMinutes(minutes);
      return res;
    };

    ///////////////////////////////////////////////////////

    $scope.search = '';
    $scope.searchNameAndCompany = function(item){//custom filter: uses guest name and company name to filter
      var res;
      res = guestFilterFactory.searchGuestNameAndCompany(item,$scope.search);
      return res;
    };

    ///////////////////////////////////////////////////////
    $scope.computeSearchTotals = function(searchInput){//computes number of guests and amount when filter is applied
      var searchTotals=[];
      if(searchInput.length>0){
        searchTotals = guestFilterFactory.computeSearchTotals(searchInput,$scope.guests);
      };
      return searchTotals;
    };

    ///////////////////////////////////////////////////////

    $scope.changeEmplIsDir = function(emplID){//returns isDirector when selecting employee from the list
      return guestCompute.changeEmplIsDir(emplID,$scope.employees);
    };

    $scope.changeEmplName = function(emplID){//what is employee's name?
     return guestCompute.changeEmplName(emplID,$scope.employees);
    };
    ///////////////////////////////////////////////////////

  }]);

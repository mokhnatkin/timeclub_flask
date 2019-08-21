'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:ReservationCtrl
 * @description
 * # ReservationCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('ReservationCtrl', ['$scope','bookingFactory','$state','rowColorsBookings','$rootScope','clientListFactory','bookingFactoryToday','bookingFactoryLastYear','bookingFactoryTodayAndFuture','msgService','textConsts','guestCompute','serverTimeFactory',
  function ($scope,bookingFactory,$state,rowColorsBookings,$rootScope,clientListFactory,bookingFactoryToday,bookingFactoryLastYear, bookingFactoryTodayAndFuture,msgService,textConsts,guestCompute,serverTimeFactory) {
    $scope.showInfo = false;//show / hide table with bookings
    $scope.showAddBookingForm = true;//show add booking form
    $scope.showSearchForm = true;//show search booking form
    $scope.showEditBookingForm = false;//show edit booking form
    $scope.phoneMask = textConsts.getPhoneMask();
    $scope.statuses = textConsts.getBookingStatuses();//possible statuses
    var N;
    $scope.TodayBookingsBtn = true;//show Today bookings button
    $scope.TodayAndFutureBookingsBtn = true;//show Today and Future bookings button
    $scope.AllBookingsBtn = true;//show All bookings button
    $scope.PastYearBookingsBtn = true;//show Past year bookings button    
   
    ///////////////////////////////////////////////////////
  

    $scope.showTodayBookings = function(){//fetch today's bookings
      bookingFactoryToday.getItems()
        .then(function(response) {
          $scope.bookings = response.data; 
          N = $scope.bookings.length;
          $scope.showInfo = true;
          $scope.search = "";
          $scope.TodayBookingsBtn = false;
          $scope.TodayAndFutureBookingsBtn = true;
          $scope.AllBookingsBtn = true;
          $scope.PastYearBookingsBtn = true;
          },
        function(error) {
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
        });
    };

    $scope.showTodayBookings();

    $scope.showTodayAndFutureBookings = function(){//fetch today's and future bookings
      bookingFactoryTodayAndFuture.getItems()
        .then(function(response){
          $scope.bookings = response.data; 
          N = $scope.bookings.length;
          $scope.showInfo = true;
          $scope.search = "";
          $scope.TodayBookingsBtn = true;
          $scope.TodayAndFutureBookingsBtn = false;
          $scope.AllBookingsBtn = true;
          $scope.PastYearBookingsBtn = true;
          },
        function(error){
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
        });
    };

    $scope.showAllBookings = function(){//fetch all bookings
      bookingFactory.getItems()
        .then(function(response){
          $scope.bookings = response.data;
          N = $scope.bookings.length;
          $scope.showInfo = true;
          $scope.search = "";
          $scope.TodayBookingsBtn = true;
          $scope.TodayAndFutureBookingsBtn = true;
          $scope.AllBookingsBtn = false;
          $scope.PastYearBookingsBtn = true;
        },
        function(error){
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
      });
    };

    $scope.showPastYearBookings = function(){//fetch past year bookings
      bookingFactoryLastYear.getItems()
        .then(function(response){
          $scope.bookings = response.data;
          N = $scope.bookings.length;          
          $scope.showInfo = true;
          $scope.search = "";      
          $scope.TodayBookingsBtn = true;
          $scope.TodayAndFutureBookingsBtn = true;
          $scope.AllBookingsBtn = true;
          $scope.PastYearBookingsBtn = false;
    },
      function(error){
        $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
      });      
    };    
 
    ///////////////////////////////////////////////////////
    $scope.setRowBackgroud = function(bookingStatus){//set background color to row depending on free guest att and promotion
      var rowClass;
      rowClass = rowColorsBookings.setRowColor(bookingStatus,$scope.statuses);
      return rowClass;
    };

    ///////////////////////////////////////////////////////

    //$scope.newBooking = new bookingFactory();//new empty booking object
    $scope.newBooking = {}

    $scope.addBooking = function(newBooking){
      var currentTimeServer, Today;      
      if(newBooking.date == null || newBooking.date == undefined)
        {
          window.alert(msgService.getMsg("needDateTimeBooking"));
        } else
            {
                serverTimeFactory.getItem()//trying fetch date and time from server
                  .then(function(response) {
                      currentTimeServer = response.data;//date&time from server
                      Today = new Date(currentTimeServer.currentDateTime);
                      if(newBooking.date>Today){//OK - save the booking
                        $scope.postBookingToDB(newBooking, Today);
                      } else {
                        {window.alert(msgService.getMsg("noBookingInPast"));};
                      };
                  },
                  function(error) {
                      Today = new Date();//if fails, use local machine date & time                      
                      console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));
                      if(newBooking.date>Today){//OK - save the booking
                        $scope.postBookingToDB(newBooking, Today);
                      } else {
                        {window.alert(msgService.getMsg("noBookingInPast"));};
                      };                      
                  });
            };
    };

    $scope.postBookingToDB = function(newBooking, Today){//add one new booking - post to DB via REST server
            newBooking.status = $scope.statuses[0];//Новая бронь

            bookingFactory.createItem(newBooking)
            .then(function (response) {                
                $scope.showAddGuestModel = !$scope.showAddGuestModel;                
                var isUnique = true;
                
                clientListFactory.findItemByPhone(newBooking.phone)
                .then(function(response) {
                  var find_res = response.data;                  
                  if(find_res.result == true) {
                    isUnique = false;
                  };

                  if(isUnique){                    
                    var newClient = {}
                    newClient.phone = newBooking.phone;
                    newClient.name = newBooking.name;
                    newClient.sysComment = "клиент создан при создании брони  "+Today+" пользователем "+$rootScope.currentUserName;
                    clientListFactory.createItem(newClient)
                    .then(function (response) {            
                        console.log("Клиент из брони: "+msgService.getMsg("recordCreated"));
                        newClient = {};                        
                    }, function(error) {console.log(msgService.getMsg("cannotSaveRecord"));}
                    );
                  };

                }, function(error) {
                  $scope.status = 'Unable to use find by phone service: ' + error.message;
                  console.log($scope.status);
                });

                $scope.newBooking = {};
                $state.reload();
            }, function(error) {
                $scope.status = 'Unable to create item: ' + error.message;
                console.log($scope.status);
            });
    };

    $scope.cancelAddingBooking = function(){ //cancel Adding booking - clear fields
        $scope.newBooking = {};
    };
  
    ///////////////////////////////////////////////////////
    $scope.checkBookingStatusBeforeUpdate = function(currentStatus,newStatus){ //checks if it makes sense to change booking status as requested
      var result = true;
      if(currentStatus == newStatus){ //current status and new status are equal - no sense to change
        result = false;
      } else {
        if(currentStatus == $scope.statuses[1] && (newStatus==$scope.statuses[2] || newStatus==$scope.statuses[3])){
          result = false;
        };
        if(currentStatus == $scope.statuses[2] && newStatus==$scope.statuses[3]){
          result = false;
        };
        if(currentStatus == $scope.statuses[3] && newStatus==$scope.statuses[2]){
          result = false;
        };        
      };      
      return result;
    };

    ///////////////////////////////////////////////////////
    
    $scope.showModifyBookingForm = function(){//change the details of a booking
      var bookingSelected = false;//is there any guest selected for check-out?      
      var countSelected = 0;     
      var bookingSelectedN;
      for (var i = 0; i < N; i++){
        bookingSelected = bookingSelected || $scope.bookings[i].isSelected;//is there any guest selected for check-out?
        if ($scope.bookings[i].isSelected){
          countSelected++;//this array stores bookings to modify
          $scope.modifiedBooking = $scope.bookings[i];
          bookingSelectedN = i;
        };
      };
      if (bookingSelected) {//at least one booking is selected
        if (countSelected == 1){
          if ($scope.bookings[bookingSelectedN].status == $scope.statuses[0]){//new booking - possible to modify this booking
            $scope.showEditBookingForm = true;
            $scope.showAddBookingForm = false;
            $scope.showSearchForm = false;
            $scope.bookings[bookingSelectedN].isSelected = false;
            } else {window.alert(msgService.getMsg("cannotUpdateThisBooking"));}
          } else {window.alert(msgService.getMsg("selectJustOneRow"));}
        }
        else {
          window.alert(msgService.getMsg("selectTheRowToChange"));
        };
    };

    $scope.postChangesToBooking = function(modifiedBooking){
      var currentTimeServer,Today;
      if(modifiedBooking.date == null || modifiedBooking.date == undefined)
      {
        window.alert(msgService.getMsg("needDateTimeBooking"));
      } else
          {
              serverTimeFactory.getItem()//trying fetch date and time from server
                .then(function(response) {
                    currentTimeServer = response.data;//date&time from server
                    Today = new Date(currentTimeServer.currentDateTime);
                    if(modifiedBooking.date>Today){//OK - save the booking
                      $scope.postChangesOfBookingToDB(modifiedBooking);
                    } else {
                      {window.alert(msgService.getMsg("noBookingInPast"));};
                    };                      
                },
                function(error) {
                    Today = new Date();//if fails, use local machine date & time                      
                    console.log("serverTimeFactory: "+msgService.getMsg("cannotQueryData"));
                    if(modifiedBooking.date>Today){//OK - save the booking
                      $scope.postChangesOfBookingToDB(modifiedBooking);
                    } else {
                      {window.alert(msgService.getMsg("noBookingInPast"));};
                    };                      
                });
          };
    };

    $scope.postChangesOfBookingToDB = function(modifiedBooking){//post modified booking to DB

        bookingFactory.updateItem($scope.modifiedBooking)
        .then(function (response) {
            $state.reload();
        }, function (error) {
            console.log('Item cannot be updated:'+ error.message);                
        });

      $scope.showEditBookingForm = false;
      $scope.showAddBookingForm = true;
      $scope.showSearchForm = true;
      
    };

    $scope.cancelEditingBooking = function(modifiedBooking){//cancel modifying booking
      $scope.showEditBookingForm = false;
      $scope.showAddBookingForm = true;
      $scope.showSearchForm = true;
      $scope.bookings[bookingSelectedN].isSelected = true;
      $scope.modifiedBooking = {};      
      $state.reload();
    };

    ///////////////////////////////////////////////////////

    $scope.changeBookingStatus = function(bookingStatus){
      var bookingSelected = false;    
      var countSelected = 0;
      var i, k;
      for (i = 0; i < N; i++){
        bookingSelected = bookingSelected || $scope.bookings[i].isSelected;
        if ($scope.bookings[i].isSelected){
          countSelected++;//this array stores selected bookings
          k = i;
        };
      };
      if (bookingSelected) {//at least one booking is selected        
        if (countSelected == 1){
          var isStatusChangePossible = false;
          isStatusChangePossible = $scope.checkBookingStatusBeforeUpdate($scope.bookings[k].status,bookingStatus);
          if (isStatusChangePossible){
            $scope.bookings[k].isSelected = false;
            $scope.bookings[k].status = bookingStatus;//status from html function            
            
            bookingFactory.updateItem($scope.bookings[k])
              .then(function (response) {
                  $state.reload();
              }, function (error) {
                  console.log('Item cannot be updated:'+ error.message);                
              });
            } else {window.alert(msgService.getMsg("bookingWrongStatus")+$scope.bookings[k].status+" на "+bookingStatus)};    
          } else {window.alert(msgService.getMsg("selectJustOneRow"));}
        }
        else {
          window.alert(msgService.getMsg("selectTheRowToChange"));
        };
    };
    
    ///////////////////////////////////////////////////////
    //calendar settings from textConsts service
    $scope.hourStep = textConsts.getCalendarSetting("hourStep");
    $scope.minuteStep = textConsts.getCalendarSetting("minuteStep");
    $scope.format = textConsts.getCalendarSetting("format");
    $scope.dateOptions = {
      showWeeks: textConsts.getCalendarSetting("showWeeks"),
      startingDay: textConsts.getCalendarSetting("startingDay")
    };

}]);
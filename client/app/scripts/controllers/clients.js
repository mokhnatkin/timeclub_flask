'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:ClientsCtrl
 * @description
 * # ClientsCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('ClientsCtrl', ['$scope','clientListFactory','$state','$rootScope','msgService','textConsts',
  function ($scope,clientListFactory,$state,$rootScope,msgService,textConsts) {
    $scope.showInfo = false;//show / hide table with clients
    $scope.message = msgService.getMsg("loadingInProgress");
    $scope.phoneMask = textConsts.getPhoneMask(); //9 stands for any digit   
    var N;
    
    clientListFactory.getItems()  //fetch clients from the REST server
        .then(function(response) {
          $scope.clientlist = response.data;
          N = $scope.clientlist.length;
          $scope.showInfo = true;
        },
        function(error) {
          $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
    });

    $scope.newClient = {}; //new empty client object  
        
    $scope.addClient = function(newClient,isManually){//add one new client - post to DB via REST server
        //check - client's phone number should be unique
        var isMaskOK = false;        
        if(newClient.phone.match(/^\d+$/) && newClient.phone.length==10) isMaskOK = true;
        //isMaskOK == true if phone length=10 and phone filed contains digitals only
        if(isMaskOK){//OK - mask is passed
            var isUnique = true;
            var Today = new Date();
            /*for (var i = 0; i < N; i++){
                if(newClient.phone == $scope.clientlist[i].phone) {
                    isUnique = isUnique && false;
                };
            };*/

            clientListFactory.findItemByPhone(newClient.phone)
            .then(function(response) {
              var find_res = response.data;                  
              if(find_res.result == true) {
                isUnique = false;
              };

              if(isUnique){ //new client with unique phone number
                if(isManually){
                    newClient.sysComment = "добавлено "+Today+" пользователем "+$rootScope.currentUserName;
                } else newClient.sysComment = "загружено из файла "+Today+" пользователем "+$rootScope.currentUserName;                
                clientListFactory.createItem(newClient)
                .then(function() {//save new client                    
                    if(isManually){
                        $scope.newClient = {};
                        $state.reload(); //update the list of clients
                    };
                },
                function()
                    {
                        if(isManually){window.alert(msgService.getMsg("cannotSaveRecord"));}
                        else console.log("clientListFactory: "+msgService.getMsg("cannotSaveRecord"));
                    }
                );
                } else { //phone number is not unique
                    if(isManually){window.alert(msgService.getMsg("phoneNotUnique"));}
                    else console.log("загрузка из excel файла: "+msgService.getMsg("phoneNotUnique"));
                };
            }, function(error) {
              $scope.status = 'Unable to use find by phone service: ' + error.message;
              console.log($scope.status);
            });
        } else {
            if(isManually){window.alert(msgService.getMsg("phoneWrongFormat"));}
            else console.log("загрузка из excel файла: "+msgService.getMsg("phoneWrongFormat"));
        };        
    };

    $scope.cancelAddingClient = function(){ //cancel Adding guest - clear fields and hide the modal
        $scope.newClient = {};
    };

    $scope.DeleteClient = function(newClient){//delete selected client
        if($rootScope.isAdmin){
            var clientSelected = false;//is there any user selected?   
            var clientToDeleteId;
            for (var i = 0; i < N; i++){
                clientSelected = clientSelected || $scope.clientlist[i].isSelected;//is there any promo selected?
            };//end for
            if (clientSelected) {
              if (window.confirm("Подтвердите удаление") == true) {
                for (i = 0; i < N; i++){
                  if ($scope.clientlist[i].isSelected){
                    clientToDeleteId = $scope.clientlist[i].id;                  
                    //remove client                  
                    clientListFactory.deleteItem(clientToDeleteId)
                    .then(function() {
                        //Removed sucessfully
                        $state.reload();
                        },
                        function(){
                        window.alert(msgService.getMsg("cannotDeleteRecord"));
                    });                    
                  };//end if
                };//end for
              } else {//removing is not confirmed
                for (i = 0; i < N; i++){ 
                  $scope.clientlist[i].isSelected = false;}
                }            
            } else {window.alert(msgService.getMsg("selectTheRowToDelete"));};
        } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

}]);
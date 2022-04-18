'use strict';

/**
 * @ngdoc function
 * @name timeclubAngularApp.controller:PreferencesCtrl
 * @description
 * # PreferencesCtrl
 * Controller of the timeclubAngularApp
 */
angular.module('timeclubAngularApp')
  .controller('PreferencesCtrl', ['$scope','promotionFactory','$state','staffFactory','$rootScope','msgService','textConsts','emplFactory','constFactory',
  function ($scope, promotionFactory, $state, staffFactory,$rootScope,msgService,textConsts,emplFactory,constFactory) {
    $scope.showInfo = false;
    $scope.showEmps = false;
    $scope.showChngPwdModal = false;
    $scope.defaultRoleForNewUsers = textConsts.getDefaultRoleForNewUsers();
    $scope.message = msgService.getMsg("cannotQueryData");
    $scope.promotionTypes = textConsts.getPromotionTypes();   
    $scope.consts = textConsts.getConstArr();//show constants
    $scope.showChangeButton = true;
    $scope.currentUserName = $rootScope.currentUserName;
    $scope.currentUserId = $rootScope.currentUserId;
    

    //////////////////////////////////////////////////////////////////////////////////
    emplFactory.getItems()  //fetch employees from the REST server      
      .then(function(response) {
        $scope.employees = response.data;
        $scope.showEmps = true;
        },
      function(error) {
        $scope.message = msgService.getMsg("cannotQueryData")+response.status + " " + response.statusText;
        window.alert("emplFactory: "+msgService.getMsg("cannotQueryData"));
      });
    
    //////////////////////////////////////////////////////////////////////////////////
    $scope.showPromos = false;
 
    promotionFactory.getItems()
              .then(function (response) {
                  $scope.promotions = response.data;
                  $scope.showPromos = true;
              }, function (error) {
                  $scope.status = 'Unable to load promotions data: ' + error.message;
              });

    $scope.showUsers = false;
    
    //////////////////////////////////////////////////////////////////////////////////
    staffFactory.getItems()  //fetch users from the REST server
      .then(function(response) {
        $scope.staffs = response.data; //all users are now in this array
        $scope.showUsers = true;
        },
      function(error) {
        window.alert("staffFactory: "+msgService.getMsg("cannotQueryData"));
    });
    
  //////////////////////////////////////////////////////////////////////////////////
    //$scope.newPromotion = new promotionFactory();
    $scope.newPromotion = {
      name: '',
      type: '',
      typeDesc: '',
      value: 0
    };

    $scope.addPromotion = function(){//add new promotion
      if($rootScope.isAdmin){
        $scope.newPromotion.isActive = true;
        for (var i = 0; i < $scope.promotionTypes.length; i++){
          if ($scope.promotionTypes[i].desc == $scope.newPromotion.typeDesc) {
            $scope.newPromotion.type = $scope.promotionTypes[i].type;
          };
        };       
        promotionFactory.createItem($scope.newPromotion)
        .then(function (response) {            
            console.log('Item created');
            $scope.promotions.push($scope.newPromotion);
            $scope.showAddPromotionModal = !$scope.showAddPromotionModal;
        }, function(error) {
            $scope.status = 'Unable to create promotion: ' + error.message;
            console.log($scope.status);
        });
      } else { //not admin
        $scope.cancelAddingPromotion();
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
    };
  
    $scope.toggleAddPromotionModal = function(){ //toggle Add promotion modal
      $scope.showAddPromotionModal = !$scope.showAddPromotionModal;
    };

    $scope.cancelAddingPromotion = function(){ //cancel Adding guest - clear fields and hide the modal
      $scope.newPromotion = {};
      $scope.showAddPromotionModal = !$scope.showAddPromotionModal;      
    };

  $scope.ToggleIsActiveFlagPromotion = function(){//activate or deactivate
    $scope.promoSelected = false;//is there any promo selected?
    var N;
    N = $scope.promotions.length;
    for (var i = 0; i < N; i++){
      $scope.promoSelected = $scope.promoSelected || $scope.promotions[i].isSelected;//is there any promo selected?
    };//end for
    if ($scope.promoSelected) {
      if($rootScope.isAdmin){
        for (i = 0; i < N; i++){
          if ($scope.promotions[i].isSelected){
            $scope.promotions[i].isActive = !$scope.promotions[i].isActive;//toggle isActive flag
            $scope.promotions[i].isSelected = !$scope.promotions[i].isSelected;
            //console.log("item",$scope.promotions[i])
            promotionFactory.updateItem($scope.promotions[i])
              .then(function (response) {
                  console.log('Item updated');
                  //$state.reload();
              }, function (error) {
                  console.log('Item cannot be updated:'+ error.message);                
              });
          };//end if
        };
      } else {
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
    } else {window.alert(msgService.getMsg("selectTheRowToChange"));};      
  };
  
    //////////////////////////////////////////////////////////////////////////////////
    $scope.roles = [{'name':'user'},
                    {'name':'admin'}]

    $scope.register = function(){//creates new user
      if($rootScope.isAdmin){
        //var created = new Date();
        var new_user = {
          'username':this.email,
          'email':this.email,
          'password':this.password,
          'role':this.role.name
        };
        if (this.password === this.passwordConf) {
            staffFactory.createItem(new_user)
            .then(function (response) {
              $scope.showAddUserModal = !$scope.showAddUserModal;              
              console.log('user created')
              $state.reload();
          }, function (error) {
              console.log(error);
              window.alert("authService: "+msgService.getMsg("cannotSaveRecord"));            
          });
        } else {
          this.passwordConf = "";
          window.alert(msgService.getMsg("passwordIsNotConfirmed"));
        };
      } else {
        $scope.cancelAddingUser();
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
  };    

    //////////////////////////////////////////////////////////////////////////////////
    $scope.showAddEmployeeModal = false;
    $scope.toggleAddEmployeeModal = function(){ //toggle Add employee modal
        $scope.showAddEmployeeModal = !$scope.showAddEmployeeModal;
    };

    $scope.cancelAddingEmployee = function(){ //cancel Adding employee - clear fields and hide the modal
      $scope.newEmployee = {};
      $scope.showAddEmployeeModal = !$scope.showAddEmployeeModal;      
    };

    $scope.newEmpl = {};
    $scope.addNewEmpl= function(){//put new employee to DB
      if($rootScope.isAdmin){
          emplFactory.createItem($scope.newEmpl)
          .then(function (response) {            
              console.log('Item created');
              $scope.newEmpl = {};
              $scope.showAddEmployeeModal = !$scope.showAddEmployeeModal;
              $state.reload();
          }, function(error) {
              $scope.status = 'Unable to create employee: ' + error.message;
              console.log($scope.status);
          });          
        
      } else { //not admin
        $scope.cancelAddingEmployee();
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
    };

    $scope.deleteEmpl = function(){//delete employee
      if($rootScope.isAdmin){
        $scope.emplSelected = false;//is there any user selected?
        var N, emplToDeleteId;          
        N = $scope.employees.length;
        //var roleDetailsInfo = {};        
        for (var i = 0; i < N; i++){
          $scope.emplSelected = $scope.emplSelected || $scope.employees[i].isSelected;//is there any promo selected?
        };//end for
        if ($scope.emplSelected) {
          if (window.confirm("Подтвердите удаление") == true) {
            for (i = 0; i < N; i++){
              if ($scope.employees[i].isSelected){
                emplToDeleteId = $scope.employees[i].id;
                emplFactory.deleteItem(emplToDeleteId)
                  .then(function() {
                  $state.reload(); //update                 
                  },
                  function(){
                    window.alert("emplFactory: "+msgService.getMsg("cannotDeleteRecord"));
                  });
              };//end if
            };//end for
          } else { //removing is not confirmed
            for (i = 0; i < N; i++){ 
              $scope.employees[i].isSelected = false;}
            }            
        } else {window.alert(msgService.getMsg("selectTheRowToDelete"));};
      } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    //////////////////////////////////////////////////////////////////////////////////
    $scope.showAddUserModal = false;
    $scope.toggleAddUserModal = function(){ //toggle Add guest modal
        $scope.showAddUserModal = !$scope.showAddUserModal;
    };
  
    $scope.cancelAddingUser = function(){ //cancel Adding guest - clear fields and hide the modal
        $scope.newUser = {};
        $scope.showAddUserModal = !$scope.showAddUserModal;      
    };

    $scope.DeleteUser = function(){
        if($rootScope.isAdmin){
          $scope.userSelected = false;//is there any user selected?   
          var N, userToDeleteId;          
          N = $scope.staffs.length;
          var roleDetailsInfo = {};
          
          for (var i = 0; i < N; i++){
            $scope.userSelected = $scope.userSelected || $scope.staffs[i].isSelected;//is there any promo selected?
          };//end for
          if ($scope.userSelected) {
            if (window.confirm("Подтвердите удаление") == true) {
              for (i = 0; i < N; i++){
                if ($scope.staffs[i].isSelected){
                  userToDeleteId = $scope.staffs[i].id;                  
                  roleDetailsInfo = roleDetails.getRoleDetailsByUserId(userToDeleteId,$scope.roleMapping,$scope.roles);
                  if(roleDetailsInfo.roleName == $rootScope.adminRoleName){
                    window.alert(msgService.getMsg("cannotDeleteAdminUser"));
                  } else {
                 //remove user                  
                  staffFactory.deleteItem(userToDeleteId)
                    .then(function() {
                        if (roleDetailsInfo.roleMappingId!="" || roleDetailsInfo.roleMappingId!='undefined'){ //check if RoleMappings exists
                          roleMappingFactory.remove({id: roleDetailsInfo.roleMappingId}, function() {                           
                          },
                          function(){window.alert("roleMappingFactory: "+msgService.getMsg("cannotDeleteRecord"));}
                          );
                        } else {$state.reload();};//no RoleMapping for this user
                    $state.reload(); //update                 
                    },
                    function(){
                      window.alert("staffFactory: "+msgService.getMsg("cannotDeleteRecord"));
                    });
                  }; 
                };//end if
              };//end for
            } else { //removing is not confirmed
              for (i = 0; i < N; i++){ 
                $scope.staffs[i].isSelected = false;}//msgService.getMsg("selectTheRowToDelete")
              }            
          } else {window.alert(msgService.getMsg("selectTheRowToDelete"));};
        } else {window.alert(msgService.getMsg("adminRoleNeeded"));};
    };

    $scope.ShowUserRole = function(userId){
      return roleDetails.getRoleDetailsByUserId(userId,$scope.roleMapping,$scope.roles).roleName;
    };

    
    $scope.toggleChngPwdModal = function(){ //toggle Change password modal
      $scope.showChngPwdModal = !$scope.showChngPwdModal;
    };

    $scope.this_user = {
      'id': $scope.currentUserId,
      'password': ''
    }

    $scope.new_password = ''
    $scope.new_password2 = ''

    $scope.changePassword = function(){ //change user's password
      if (($scope.new_password == $scope.new_password2) && ($scope.new_password.length > 5))
      {
        $scope.this_user.password = $scope.new_password;
        staffFactory.updateItem($scope.this_user)
          .then(function (response) {
              //console.log('Item updated');
              $scope.new_password = '';
              $scope.new_password2 = '';              
              $scope.showChngPwdModal = false;              
              window.alert('Пароль успешно изменен');
          }, function (error) {
              console.log('Item cannot be updated:'+ error.message);
              window.alert('Ошибка сервера при изменении пароля');
          });
        } else {
            window.alert('Введенные пароли не совпадают, либо длина нового пароля меньше 6 символов');
            $scope.new_password = '';
            $scope.new_password2 = '';
        };
      
    };

    $scope.cancelChangePassword = function(){ //cancel Change pwd - clear fields and hide the modal      
      $scope.showChngPwdModal = !$scope.showChngPwdModal;
    };

    //////////////////////////////////////////////////////////////////////////////////
    constFactory.getItems()
    .then(function (response) {
        $scope.constsDB = response.data;
        //$scope.showConstsDB = true;
    }, function (error) {
        $scope.status = 'Unable to load constants data: ' + error.message;
    });

    $scope.newConst = {
      name: '',
      description: '',
      value: 0
    };

    $scope.addConst = function(){//add new const
      if($rootScope.isAdmin){
        constFactory.createItem($scope.newConst)
        .then(function (response) {            
            console.log('Item created');
            $scope.constsDB.push($scope.newConst);
            $scope.showAddConstModal = !$scope.showAddConstModal;
        }, function(error) {
            $scope.status = 'Unable to create const: ' + error.message;
            console.log($scope.status);
        });
      } else { //not admin
        $scope.cancelAddingConst();
        window.alert(msgService.getMsg("adminRoleNeeded"));
      };
    };
  
    $scope.toggleAddConstModal = function(){ //toggle Add const modal
      $scope.showAddConstModal = !$scope.showAddConstModal;
    };

    $scope.cancelAddingConst = function(){ //cancel Adding const - clear fields and hide the modal
      $scope.newConst = {};
      $scope.showAddConstModal = !$scope.showAddConstModal;      
    };
    
    $scope.constToEdit = {
      name: '',
      description: '',
      value: 0
    };    

    $scope.ToggleEditConstModal = function(){//toggle Edit const modal
      $scope.constSelected = false;//is there any const selected?
      var N;
      var countSelected = 0;
      N = $scope.constsDB.length;
      for (var i = 0; i < N; i++){
        $scope.constSelected = $scope.constSelected || $scope.constsDB[i].isSelected;//is there any const selected?
        if ($scope.constsDB[i].isSelected){
          countSelected = countSelected+1;
        }
      };//end for
      if (countSelected == 1) {
        if($rootScope.isAdmin){
          for (i = 0; i < N; i++){
            if ($scope.constsDB[i].isSelected){
              $scope.constsDB[i].isSelected = !$scope.constsDB[i].isSelected;
              $scope.constToEdit = $scope.constsDB[i];
              $scope.showEditConstModal = !$scope.showEditConstModal;
            };//end if
          };
        } else {
          window.alert(msgService.getMsg("adminRoleNeeded"));
        };
      } else {window.alert(msgService.getMsg("selectTheRowToChange"));};      
    };

    $scope.editConstDB = function(){ //edit const DB
      constFactory.updateItem($scope.constToEdit)
      .then(function (response) {
          console.log('Item updated');
          $scope.showEditConstModal = !$scope.showEditConstModal;
      }, function (error) {
          console.log('Item cannot be updated:'+ error.message);                
      });
    };

    $scope.cancelEditConst = function(){ //cancel Edit const - clear fields and hide the modal
      $scope.constToEdit = {};
      $scope.showEditConstModal = !$scope.showEditConstModal;      
    };

  }]);
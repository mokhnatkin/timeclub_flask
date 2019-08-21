'use strict';


/**
 * @ngdoc overview
 * @name timeclubAngularApp
 * @description
 * # timeclubAngularApp
 *
 * Main module of the application.
 */
angular
  .module('timeclubAngularApp', [
    'ngResource',
    'ui.router',
    'ui.bootstrap',    
    'ui.bootstrap.datetimepicker',
    'ui.mask',
    'LocalStorageModule',
    'angularChart',
    'angularUtils.directives.dirPagination'
  ])

   .config(function ($stateProvider, $urlRouterProvider, localStorageServiceProvider) {
        $stateProvider
            .state('app', {
                url:'/',
                views: {
                    'header': {
                        templateUrl : 'views/header.html',
                        controller  : 'HeaderCtrl'
                    },
                    'content': {
                        templateUrl : 'views/main.html',
                        controller  : 'MainCtrl'
                    },
                    'footer': {
                        templateUrl : 'views/footer.html'
                    }
                }
            })

            .state('app.reservations', {
                url:'reservations',
                views: {
                    'content@': {
                        templateUrl : 'views/reservations.html',
                        controller  : 'ReservationCtrl'
                    }
                }
            })

            .state('app.dashboard', {
                url:'dashboard',
                views: {
                    'content@': {
                        templateUrl : 'views/dashboard.html',
                        controller  : 'DashboardCtrl'
                    }
                }
            })

            .state('app.history', {
                url:'history',
                views: {
                    'content@': {
                        templateUrl : 'views/history.html',
                        controller  : 'HistoryCtrl'
                    }
                }
            })

            .state('app.stat', {
                url:'stat',
                views: {
                    'content@': {
                        templateUrl : 'views/stat.html',
                        controller  : 'StatCtrl'
                    }
                }
            })

            .state('app.clients', {
                url:'clients',
                views: {
                    'content@': {
                        templateUrl : 'views/clients.html',
                        controller  : 'ClientsCtrl'
                    }
                }
            })

            .state('app.preferences', {
                url:'preferences',
                views: {
                    'content@': {
                        templateUrl : 'views/preferences.html',
                        controller  : 'PreferencesCtrl'
                    }
                }
            })

            .state('app.login',{
                url:'login',
                views: {
                    'header@': {
                        templateUrl : 'views/header-login.html'
                    },
                    'content@': {
                        templateUrl : 'views/login.html',
                        controller  : 'LoginCtrl'
                    }
                }
            })

            .state('Modal', {
                views:{
                  'modal': {
                    templateUrl: 'views/modal.html',
                    controller  : 'MainCtrl'
                    }
                },
                abstract: true
            })

            .state('Modal.confirmClose', {
                views:{
                  'modal': {
                    templateUrl: 'views/confirm.html',
                    controller  : 'CheckoutCtrl'
                  }
                }
            })

            .state('app.emplwages', {
                url:'emplwages',
                views: {
                    'content@': {
                        templateUrl : 'views/emplwages.html',
                        controller  : 'EmplWagesCtrl'
                    }
                }
            })

            .state('Modal.checkoutDetails', {
                views: {
                    'modal': {
                        templateUrl : 'views/checkoutdetails.html',
                        controller  : 'CheckoutDetailsCtrl'
                    }
                },
                onEnter: ['$state', function($state) {
                  $(document).on('keyup', function(e) {
                    if(e.keyCode == 27) { //ESC button
                      $(document).off('keyup');
                      $state.go('app');
                    }
                  });

                  $(document).on('click', '.Modal-backdrop, .Modal-holder', function() {
                    $state.go('app');
                  });

                  $(document).on('click', '.Modal-box, .Modal-box *', function(e) {
                    e.stopPropagation();
                  });
                }]
            })

            ;

        $urlRouterProvider.otherwise('/');

        localStorageServiceProvider
            .setPrefix('timeclubAngularApp')
            .setStorageType('localStorage');

    })

    .run(['$rootScope', '$location', 'localStorageService','textConsts',
        function ($rootScope, $location, localStorageService, textConsts) {        
        $rootScope.adminRoleName = textConsts.getAdminRoleName(); //Name of admin role
        $rootScope.oneDayInMSec = textConsts.getOneDayInMSec(); //one day in milliseconds
        if(localStorageService.isSupported) {//fetch from local storage
            $rootScope.currentUserId = localStorageService.get("currentUserId");
            $rootScope.currentUserName = localStorageService.get("currentUserName");
            $rootScope.currentUserRole = localStorageService.get("currentUserRole");
            $rootScope.isAdmin = localStorageService.get("isAdmin");
            $rootScope.isAuthenticated = localStorageService.get("isAuthenticated");            
          };

        $rootScope
            .$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                $("#ui-view").html("");
                $(".page-loading").removeClass("hidden");
            });

        $rootScope
            .$on('$stateChangeSuccess',
            function (event, toState, toParams, fromState, fromParams) {
                $(".page-loading").addClass("hidden");
            });


        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
            if (restrictedPage && !$rootScope.isAuthenticated) {
                console.log("Not Authenticated");
                $location.path('/login');
            }

            if ($rootScope.isAuthenticated) {
                $location.path('/');
            }
        });
    }])

    .filter("phoneFilter", function() {
        //Defining the filter function - phone mask
            return function(input) {
                var result = "";
                result = "+7("+input.slice(0,3)+")"+input.slice(3,6)+" "+input.slice(6,8)+" "+input.slice(8,10);
                return result;
            };
        })

  ;

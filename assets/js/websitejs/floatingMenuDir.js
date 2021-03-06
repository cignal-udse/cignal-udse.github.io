app.controller("floatingMenuCtrl", function($scope) {
    console.log('floatingMenuCtrl')

    $scope.loader = { isLoadingData: true, isSigningUp: false, isLoggingIn: false, isLoggingOut: false, isForgotPassword: false };
    $scope.activeUser = Parse.User.current();
    $scope.user = {};
    $scope.branches = [];
    $scope.newData = { };
    $scope.retypePassword = '';
    $scope.forgotEmail = '';

    if ($scope.activeUser) {
        if ($scope.activeUser.get('type') != 'CUSTOMER') {
            console.log('logout', $scope.activeUser)
            Parse.User.logOut().then(function() {
                $scope.activeUser = null;
                $scope.$apply();
            });
        }
    }

    // Load branches
    var Branch = Parse.Object.extend("Branch");
    var query = new Parse.Query(Branch);
    query.ascending('name');
    query.find({
        success: function(results) {
            $scope.loader.isLoadingData = false;
            $scope.branches = results;
            $scope.$apply();
        },
        error: function(error) {
            console.log('Parse.Query(Branch) error', error)
            notification(error.message, 'danger');
            $scope.loader.isLoadingData = false;
            $scope.$apply();
        }
    });

    // signup function
    $scope.signup = function() {
        if ($scope.newData.password != $scope.retypePassword) {
            notification('Password mismatch', 'danger');
        } else {
            $scope.loader.isSigningUp = true;

            // get branch pointer
            for (var i = 0; i < $scope.branches.length; i++) {
                if ($scope.newData.branchPointer == $scope.branches[i].id) {
                    $scope.newData.branchPointer = $scope.branches[i];
                    break;
                }
            }

            $scope.newData.type = 'CUSTOMER';
            $scope.newData.status = 'PENDING';

            var user = new Parse.User();
            user.signUp($scope.newData, {
                success: function(user) {
                    Parse.User.logOut().then(function() {
                        notification('Signup success! Wait for your account approval and verify your email.', 'success', 5000);
                        $scope.loader.isSigningUp = false;
                        $scope.newData = {};
                        $scope.retypePassword = '';
                        $scope.$apply();

                        UIkit.modal('#signup').hide();
                    });
                },
                error: function(user, error) {
                    console.log('user.signUp error', error)
                    notification(error.message, 'danger', 5000, 'top-center');
                    $scope.loader.isSigningUp = false;
                    $scope.$apply();
                }
            });
        }
    };

    // login function
    $scope.login = function() {
        $scope.loader.isLoggingIn = true;

        Parse.User.logIn($scope.user.username, $scope.user.password, {
            success: function(user) {
                var isCustomer = user.get('type') == 'CUSTOMER';
                var isApproved = user.get('status') == 'APPROVED';
                var isEmailVerified = user.get('emailVerified');

                if (isCustomer && isApproved && isEmailVerified) {
                    notification('Login success', 'success');
                    location.reload();
                } else {
                    Parse.User.logOut().then(function() {
                        if (!isCustomer)
                            notification('Your account is unauthorized', 'danger', 5000);
                        else if (!isApproved)
                            notification('Your account is not yet approved', 'danger', 5000);
                        else if (!isEmailVerified)
                            notification('Your email is not yet verified', 'danger', 5000);

                        $scope.loader.isLoggingIn = false;
                        $scope.$apply();
                    });
                }
            },
            error: function(user, error) {
                console.log("Error: " + error.code + " " + error.message);
                notification(error.message, 'danger');
                $scope.loader.isLoggingIn = false;
                $scope.$apply();
            }
        });
    };

    // logout function
    $scope.logout = function() {
        $scope.loader.isLoggingOut = true;
        Parse.User.logOut().then(function() {
            var currentLocation = window.location.href;

            if (currentLocation.indexOf('user-logs') > -1 || currentLocation.indexOf('user-settings') > -1) {
                window.location.href = "index.html";
            } else {
                location.reload();
            }
        });
    };

    // forgot password function
    $scope.forgotPassword = function() {
        if (!$scope.loader.isForgotPassword) {
            if (!$scope.forgotEmail) {
                notification('Email required', 'danger');
            } else {
                $scope.loader.isForgotPassword = true;
                Parse.User.requestPasswordReset($scope.forgotEmail, {
                    success: function() {
                        notification('An email is sent to reset your password');
                        $scope.forgotEmail = '';
                        var modal = UIkit.modal("#forgotpass");
                        modal.hide();
                        $scope.loader.isForgotPassword = false;
                        $scope.$apply();
                    },
                    error: function(error) {
                        console.log(error)
                        console.log("Error: " + error.code + " " + error.message);
                        notification('Something is wrong', 'danger');
                        $scope.loader.isForgotPassword = false;
                        $scope.$apply();
                    }
                });
            }
        }
    };

    $scope.offcanvasLogin = function() {
        UIkit.offcanvas.hide([force = false]);
        UIkit.modal('#userlogin').show();
    };

    function notification (msg, status, time, pos) {
        UIkit.notify({
            message : msg,
            status  : status || 'success',
            timeout : time || 2000,
            pos     : pos || 'top-center'
        });
    }
});

app.directive('floatingMenu', function () {
    return {
        restrict: 'E',
        templateUrl: 'assets/js/websitejs/views/floatingMenu.html',
        controller: 'floatingMenuCtrl'
    }
});
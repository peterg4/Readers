var app = angular.module("myApp", []);
var socket = io();
app.controller("mainController", ['$scope','$http','$sce', function($scope, $http, $sce) {
  $scope.view = 0;
  $scope.currid = "home";

  $scope.changeActive = function(id) {
    document.getElementById($scope.currid).className = 'nav-link'; 
    document.getElementById(id).className = 'nav-link active';
    $scope.currid = id;
  }
  $scope.register = function() {
    var packet = 'p';
    socket.emit('register', packet);
  }
  $scope.addBook = function() {
    console.log("book clicked")
    var packet = 'p';
    socket.emit('insert', packet);
  }
}]);

var app = angular.module("myApp", []);
var socket = io();
app.controller("mainController", ['$scope','$http','$sce', function($scope, $http, $sce) {
  $scope.view = 0;
  $scope.currid = "home";
  $scope.user = {};
  $scope.book = {};
  $scope.changeActive = function(id) {
    document.getElementById($scope.currid).className = 'nav-link'; 
    document.getElementById(id).className = 'nav-link active';
    $scope.currid = id;
  }
  $scope.register = function() {
    var packet = $scope.user;
    socket.emit('register', packet);
  }
  $scope.addBook = function() {
    var packet = $scope.book;
    socket.emit('insert', packet);
  }
  $scope.save = function() {
    console.log($scope.user);
  }
}]);

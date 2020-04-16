var app = angular.module("myApp", []);
var socket = io();
app.controller("mainController", ['$scope','$http','$sce', function($scope, $http, $sce) {
  $scope.view = 0;
  $scope.currid = "home";
  $scope.user = {};
  $scope.book = {};
  $scope.credentials = {};
  $scope.logged = false;
  $scope.books = [];
  $scope.changeActive = function(id) {
    document.getElementById($scope.currid).className = 'nav-link'; 
    document.getElementById(id).className = 'nav-link active';
    $scope.currid = id;
  }
  $scope.register = function() {
    var packet = $scope.user;
    socket.emit('register', packet);
    socket.on('register_response', function(res) {
      console.log(res);
    })
  }
  $scope.addBook = function() {
    var packet = $scope.book;
    socket.emit('insert', packet);
    socket.on('book_response', function(res) {
      console.log(res);
    })
  }
  $scope.login = function() {
    var packet = $scope.credentials;
    socket.emit('login', packet);
    socket.on('login_response', function(res) {
      console.log(res);
      $scope.$apply(function () {
        $scope.logged = true;
        $scope.credentials.userinfo = res;
      })
    })
  }
  $scope.getInReview = function() {
    $scope.books = [];
    $http.get("/review").then(function(data) {
      console.log(data.data.data);
      for(var i = 0; i < data.data.data.length; i++) {
        $scope.books.push(data.data.data[i]);
      }
    });
  }
  $scope.getBooks = function() {
    $scope.books = [];
    $http.get("/books").then(function(data) {
      console.log(data.data.data);
      for(var i = 0; i < data.data.data.length; i++) {
        $scope.books.push(data.data.data[i]);
      }
    });
  }
  $scope.approve = function(packet) {
    console.log(packet);
    socket.emit('approve', packet);
    socket.on('book_response', function(res) {
      console.log(res);
      $scope.getInReview();
    })
  }

}]);

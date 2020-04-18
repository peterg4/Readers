jQuery.noConflict();

var app = angular.module("myApp", ['base64']);
var socket = io();
app.controller("mainController", ['$scope','$http','$sce','$base64', function($scope, $http, $sce, $base64) {
  $scope.view = 0;
  $scope.currid = "home";
  $scope.user = {};
  $scope.book = {};
  $scope.credentials = {};
  $scope.logged = false;
  $scope.books = [];
  $scope.specificBook = {};
  $scope.review = {};
  $scope.taken = 0;
  $scope.rating = 3;
  $scope.ratingComplement = 5 - $scope.rating;
  $scope.changeActive = function(id) {
    document.getElementById($scope.currid).className = 'nav-link'; 
    document.getElementById(id).className = 'nav-link active';
    $scope.currid = id;
  }
  $scope.register = function() {
    var packet = $scope.user;
    $scope.taken = 0;
    socket.emit('register', packet);
    socket.on('register_response', function(res) {
      if(res.username) {
        jQuery('#register').modal('hide');
        jQuery('#login').modal('show');
      } else {
        console.log(res);
        $scope.$apply(function () {
          $scope.taken = res;
        })
      }
    })
  }
  $scope.addBook = function() {
    $scope.processing = "css/images/loading.gif";
    var packet = $scope.book;
    console.log(packet);
    socket.emit('insert', packet);
    socket.on('book_response', function(res) {
      console.log(res);
      $scope.$apply(function () {
        $scope.processing = "css/images/done.png";
      })
    })
  }
  $scope.login = function() {
    var packet = $scope.credentials;
    socket.emit('login', packet);
    socket.on('login_response', function(res) {
      $scope.$apply(function () {
        $scope.logged = true;
        $scope.credentials.userinfo = res;
        if($scope.credentials.userinfo.firstName) {
          jQuery('#login').modal('hide');
        }
      })
    })
  }
  $scope.logout = function() {
    $scope.credentials = {};
    $scope.logged = false;
  }
  $scope.getInReview = function() {
    $scope.view = 1;
    $scope.books = [];
    $http.get("/review").then(function(data) {
      for(var i = 0; i < data.data.data.length; i++) {
        $scope.books.push(data.data.data[i]);
      }
    });
  }
  $scope.getBooks = function() {
    $scope.books = [];
    $http.get("/books").then(function(data) {
      for(var i = 0; i < data.data.data.length; i++) {
        $scope.books.push(data.data.data[i]);
      }
    });
  }
  $scope.approve = function(packet) {
    socket.emit('approve', packet);
    socket.on('book_response', function(res) {
      console.log(res);
      $scope.getInReview();
    });
  }
  $scope.deny = function(packet) {
    socket.emit('deny', packet);
    socket.on('deny_response', function(res) {
      console.log(res);
      $scope.getInReview();
    });
  }
  $scope.delete = function(packet) {
    socket.emit('delete', packet);
    socket.on('delete_response', function(res) {
      console.log(res);
      $scope.getBooks();
    });
  }
  $scope.quickRemove = function(i, decision) {
    $scope.books[i].title = decision;
    $scope.books[i].author = $scope.credentials.userinfo.firstName + " " + $scope.credentials.userinfo.lastName;
  }
  $scope.getBookDetails = function(book) {
    $scope.view=3;
    $scope.specificBook = book;
  }
  $scope.publishReview = function() {
    $scope.view=3;
    $scope.review.username = $scope.credentials.username;
    $scope.review.book = $scope.specificBook.isbn;
    socket.on('publish_response', function(res) {
      console.log(res);
      $scope.getBookDetails();
    });
    if($scope.credentials.username) {
      console.log($scope.review);
      var packet = $scope.review;
      socket.emit('publish', packet);
      socket.on('publish_response', function(res) {
        console.log(res);
        $scope.getBookDetails();
      });
    } else {
      jQuery('#login').modal('toggle');
    }
    socket.on('publish_response', function(res) {
      console.log(res);
      $scope.getBookDetails();
    });
  }
}]);

app.directive("fileread", [function () {
  return {
      scope: {
          fileread: "="
      },
      link: function (scope, element, attributes) {
          element.bind("change", function (changeEvent) {
              var reader = new FileReader();
              reader.onload = function (loadEvent) {
                  scope.$apply(function () {
                      scope.fileread = loadEvent.target.result;
                  });
              }
              reader.readAsDataURL(changeEvent.target.files[0]);
          });
      }
  }
}]);
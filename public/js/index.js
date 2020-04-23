jQuery.noConflict();

var app = angular.module("myApp", ['base64','ngRateIt']);
var socket = io();
app.controller("mainController", ['$scope','$http','$sce','$base64', function($scope, $http, $sce, $base64) {
  $scope.view = 0;
  $scope.currid = "home";
  $scope.user = {};
  $scope.book = {};
  $scope.credentials = {};
  $scope.logged = false;
  $scope.books = [];
  $scope.reading = [];
  $scope.willRead = [];
  $scope.haveRead = [];
  $scope.specificBook = {};
  $scope.review = {};
  $scope.taken = 0;
  $scope.query = "";
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
        $scope.$apply(function () {
          $scope.taken = res;
        })
      }
    })
  }
  $scope.addBook = function() {
    $scope.processing = "css/images/loading.gif";
    var packet = $scope.book;
    socket.emit('insert', packet);
    socket.on('book_response', function(res) {
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
          $scope.getLibrary();
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
      $scope.getInReview();
    });
  }
  $scope.deny = function(packet) {
    socket.emit('deny', packet);
    socket.on('deny_response', function(res) {
      $scope.getInReview();
    });
  }
  $scope.delete = function(packet) {
    socket.emit('delete', packet);
    socket.on('delete_response', function(res) {
      $scope.getBooks();
    });
  }
  $scope.quickRemove = function(i, decision) {
    $scope.books[i].title = decision;
    $scope.books[i].author = $scope.credentials.userinfo.firstName + " " + $scope.credentials.userinfo.lastName;
  }
  $scope.getBookDetails = function(book) {
    $scope.view=3;
    $scope.processing = 0;
    $http.get("/book/details?isbn="+book.isbn).then(function(data) {
      $scope.specificBook = data.data.data[0];
    })
  }
  $scope.publishReview = function() {
    $scope.processing = "css/images/loading.gif";
    $scope.view=3;
    $scope.review.username = $scope.credentials.username;
    $scope.review.book = $scope.specificBook.isbn;
    if($scope.credentials.username) {
      var packet = $scope.review;
      socket.emit('publish', packet);
      socket.on('publish_response', function(res) {
        $scope.specificBook = res;
        $scope.$apply(function () {
          $scope.specificBook = res;
          $scope.processing = "css/images/done.png";
        });
      });
    } else {
      jQuery('#login').modal('toggle');
    }
  }
  $scope.search = function(query) {
    $scope.view = 4;
    socket.emit('search', query);
    socket.on('search_response', function(res) {
      $scope.books = [];
      var temp = [];
      for(var i = 0; i < res.length; i++) {
        temp.push(res[i]);
      }
      $scope.$apply(function () {
        $scope.books = temp;
      });
    })
  }
  $scope.saveToLibrary = function(book, saveChoice) {
    if($scope.credentials.username) {
      var packet = {}
      packet.book = book;
      delete packet.book.$$hashKey;  
      packet.username = $scope.credentials.username;
      packet.saveChoice = saveChoice;
      socket.emit('save', packet);
      socket.on('save_response', function() {
        $scope.view = 2;
        $scope.getLibrary();
      });
    } else {
      jQuery('#login').modal('toggle');
    }
  }
  $scope.librarySwap = function(book, saveChoice) {
    var packet = {};
    packet.isbn = book.isbn;
    packet.saveChoice = saveChoice;
    packet.username = $scope.credentials.username;
    socket.emit('librarySwap', packet);
  }
  $scope.getLibrary = function() {
    $scope.view = 2;
    $scope.reading = [];
    $scope.willRead = [];
    $scope.haveRead = [];
    $http.get("/library?username="+$scope.credentials.userinfo.username).then(function(data) {
      for(var i = 0; i < data.data.data.length; i++) {
        if(data.data.data[i].saveChoice === 0)
          $scope.reading.push(data.data.data[i].book);
        else if(data.data.data[i].saveChoice === 1)
          $scope.willRead.push(data.data.data[i].book)
        else
          $scope.haveRead.push(data.data.data[i].book)
      }
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
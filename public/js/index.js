jQuery.noConflict();

var app = angular.module("myApp", ['ngRateIt']);
var socket = io();
app.controller("mainController", ['$scope','$http', function($scope, $http) {
  $scope.view = 0;
  $scope.currid = "home";

  $scope.user = {};
  $scope.credentials = {};
  $scope.logged = false;
  $scope.taken = 0;

  $scope.book = {};
  $scope.books = [];
  $scope.specificBook = {};

  $scope.reviewsInReview = [];

  $scope.reading = [];
  $scope.willRead = [];
  $scope.haveRead = [];
  
  $scope.review = {};
  $scope.error = false;

  $scope.query = "";
  $scope.genrePrompts = {};

  $scope.genres = [];
  $scope.genreBooks = [];
  $scope.genre = "";
  
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
      console.log(res, "1");
      if(res != 'Duplicate Book Entry') {
        $scope.$apply(function () {
          $scope.processing = "css/images/done.png";
        })
      } else {
        $scope.$apply(function () {
          console.log(res);
          $scope.error = res;
          $scope.processing = "css/images/error.png";
        })
      }
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
          $scope.changeActive('books');
          $scope.getLibrary();
        }
      })
    })
  }
  $scope.logout = function() {
    $scope.credentials = {};
    $scope.logged = false;
  }
  $scope.getInReview = function() {
    $scope.processing = 0;
    $scope.view = 1;
    $scope.books = [];
    $scope.reviewsInReview = [];
    $http.get("/review").then(function(data) {
      console.log(data);
      for(var i = 0; i < data.data.data.books.length; i++) {
        $scope.books.push(data.data.data.books[i]);
      }
      for(var i = 0; i < data.data.data.reviews.length; i++) {
        $scope.reviewsInReview.push(data.data.data.reviews[i]);
      }
    });
  }
  $scope.getBooks = function() {
    $scope.view = 0;
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
  $scope.approveReview = function(packet) {
    socket.emit('approveReview', packet);
    socket.on('approveReview_response', function(res) {
      $scope.getInReview();
    });
  }
  $scope.denyReview = function(packet) {
    socket.emit('denyReview', packet);
    socket.on('denyReview_response', function(res) {
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
        $scope.$apply(function () {
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
  $scope.genrePrompt = function() {
    $scope.genrePrompts = {};
    //make a json file with the results to query from instead of usin the database beacuse of too many reads
    socket.emit('genre_prompt', $scope.book.genre);
    socket.on('prompt_response', function(res) {
      for(var i = 0; i < res.length; i++) {
        $scope.$apply(function () {
          $scope.genrePrompts[i] = res[i].genre;
        })
      }
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
    socket.on('swap_response', function() {
      $scope.getLibrary();
    });
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
  $scope.edit = function() { 
    var packet = {};
    $scope.processing = "css/images/loading.gif";
    packet.title = $scope.book.title;
    packet.author = $scope.book.author;
    packet.genres = $scope.book.genres;
    packet.isbn = $scope.book.isbn;
    socket.emit('edit', packet);
    socket.on('edit_response', function() {
      console.log('Edit Made');
      $scope.$apply(function () {
        $scope.processing = "css/images/done.png";
      })
    });
  }
  $scope.getGenres = function() {
    $scope.view = 5;
    $scope.genres = [];
    $http.get("/genres").then(function(data) {
      for(var i = 0; i < data.data.data.length; i++) {
        $scope.genres.push(data.data.data[i]);
      }
    });
  }
  $scope.getGenre = function(genre) {
    $scope.view = 6;
    $scope.genre = genre.genre;
    $scope.genreBooks = [];
    $http.get("/genres/genre?genre="+genre.genre).then(function(data) {
      console.log(data);
      console.log(data.data.data.length);
      for(var i = 0; i < data.data.data.length; i++) {
        $scope.genreBooks.push(data.data.data[i]);
      }
      console.log($scope.genreBooks);
    });
  }
}]);
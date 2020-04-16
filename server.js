// server init + mods
var app = require('express')();
var http = require('http').Server(app);
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var io = require('socket.io')(http);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://gpeterson:popper42@readers-csf57.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
main();
async function main() { 
  var db;
  await client.connect(function(err, database) {
    if(err) throw err;
    db = database.db("test");
    console.log("connected to DB");
  }); 
  

  io.on('connection', function(socket) {  
    console.log("Client Connected")
    //Register a user
    socket.on('register', function(packet) {
      db.collection("users").findOne({username: packet.username}, function(err, results) {
        if(results || err) console.log("username taken");
        else {
          db.collection("users").insertOne(
            {
              firstName: packet.firstName,
              lastName: packet.lastName,
              username: packet.username,
              password: packet.password,
              email: packet.email,
              admin: true
            }, function(err, res) {
              if (err) throw err;
              console.log("1 user inserted");
          });
        }
      });

    });
    //Add a book to review Database
    socket.on('insert', function(packet) {
      db.collection("review").findOne({isbn: packet.isbn}, function(err, results) {
        if(results || err) console.log(results);
        else {
          db.collection("review").insertOne(
            {
              title: packet.title,
              author: packet.author,
              genres: packet.genre,
              rating: null,
              isbn: packet.isbn,
              reviewers: []
            }, function(err, res) {
              if (err) throw err;
              console.log("1 book inserted");
          });
        }
      });
    });
    socket.on('login', function(packet) {
      db.collection("users").findOne({username: packet.username, password: packet.password}, function(err, results) {
        if(results) console.log(results);
        else console.log("invalid credentials");
      });
    });
  });


  app.use(express.static('public'));

  app.get('/', function(req, res){
      res.sendFile('/index.html');
  });

  app.use(express.static('public'));

  http.listen(3000, function(){
      console.log('\nServer up on *:3000');
  });
}
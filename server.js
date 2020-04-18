// server init + mods
var app = require('express')();
var http = require('http').Server(app);
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var io = require('socket.io')(http);
var imgur = require('imgur');
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
imgur.setClientId(clientId);
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URI;
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
    //Register a user
    socket.on('register', function(packet) {
      db.collection("users").findOne({username: packet.username}, function(err, results) {
        if(results || err) {console.log("username taken"); socket.emit('register_response', "Username taken");}
        else {
          bcrypt.hash(packet.password, saltRounds, function(err, hash) {
            db.collection("users").insertOne(
              {
                firstName: packet.firstName,
                lastName: packet.lastName,
                username: packet.username,
                password: hash,
                email: packet.email,
                admin: false
              }, function(err, res) {
                if (err) throw err;
                console.log("1 user inserted");
                socket.emit('register_response', packet);
            });
          });
        }
      });
    });
    //login a user
    socket.on('login', function(packet) {
      db.collection("users").findOne({username: packet.username}, function(err, results) {
        if(results) {
          bcrypt.compare(packet.password, results.password, function(err, result) {
            if(results)
              socket.emit('login_response', results);
            else {
              console.log("invalid credentials");
              socket.emit('login_response', "Invalid Credentials");
            }
          });
        } else {
          console.log("invalid credentials");
          socket.emit('login_response', "Invalid Credentials");
        }
      });
    });
    //Add a book to review Database
    socket.on('insert', function(packet) {
      db.collection("review").findOne({isbn: packet.isbn}, function(err, results) {
        if(results || err) console.log('Duplicate Book entry: ISBN found in review');
        else {
          db.collection("items").findOne({isbn: packet.isbn}, function(err, results) {
            if(results || err) console.log('Duplicate Book entry: ISBN found in items');
            else {
              imgur.uploadBase64(packet.cover.split(',')[1]).then(function (json) {
                  console.log(json.data.link);
                  db.collection("review").insertOne(
                    {
                      title: packet.title,
                      author: packet.author,
                      genres: packet.genre,
                      rating: null,
                      isbn: packet.isbn,
                      cover: json.data.link,
                      reviewers: []
                    }, function(err, res) {
                      if (err) throw err;
                      console.log("1 book inserted to review");
                      socket.emit('book_response', packet.title);
                  });
                }).catch(function (err) {
                  console.error(err.message);
                });
            }
          });
        }
      });
    });
    //approve a book and move to viewable database
    socket.on('approve', function(packet) {
      db.collection("review").findOne({isbn: packet.isbn}, function(err, results) {
        if(results) {
          db.collection("items").findOne({isbn: packet.isbn}, function(err, res) {
            if(res || err) console.log("Duplicate Book entry: ISBN found in items," + res);
            else {
              db.collection("items").insertOne(results, function(err, res) {
                  if (err) throw err;
                  console.log("1 book inserted to items");
                  db.collection("review").deleteOne(results, function(err, res) {
                    if (err) throw err;
                    console.log("1 document approved from review");
                    socket.emit('approve_response', packet.title);
                  });
              });
            }
          });
        }
      });
    });
    //deny a book and delete it from the review database
    socket.on('deny', function(packet) {
        db.collection("review").deleteOne({isbn: packet.isbn}, function(err, results) {
          if (err) throw err;
          console.log("1 document deleted from review");
          socket.emit('deny_response', packet.title);
      });
    });
    //delete a book from the items database
    socket.on('delete', function(packet) {
      db.collection("items").deleteOne({isbn: packet.isbn}, function(err, results) {
        if (err) throw err;
        console.log("1 document deleted from items");
        socket.emit('delete_response', packet.title);
      });
    });
    //publish a review on a book
    socket.on('publish', function(packet) {
      console.log(packet);
      var query =  { isbn: packet.book};
      var review = { $push: {reviewers: packet} };
      db.collection("items").updateOne(query, review, function(err, res) {
        if (err) throw err;
        console.log("Review added");
        socket.emit('publish_response', "Submitted!");
      });
    });
    //get books in review
    app.get('/review', function(req, res) {
      db.collection("review").find({}).toArray(function(err, result) {
        if(err) throw err;
        res.json({data: result});
      })
    })
    //get books in public db
    app.get('/books', function(req, res) {
      db.collection("items").find({}).toArray(function(err, result) {
        if(err) throw err;
        res.json({data: result});
      })
    })
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
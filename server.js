// server init + mods
String.prototype.replaceAt=function(index, replacement) {
  return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}
const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const io = require('socket.io')(http);
const cors = require('cors');
var corsOptions = {
  origin: ['http://localhost:4200', "http://localhost:4000"]
}
app.use(cors(corsOptions));
const imgur = require('imgur');
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
const clientId = process.env.CLIENT_ID;
imgur.setClientId(clientId);
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URI;
const books = require('google-books-search');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const PORT = process.env.PORT || 3000;
app.get("/ghosts", (req, res) => {
  res.send("GEge");
});
main();
async function main() { 
  var db;
  await client.connect(function(err, database) {
    if(err) throw err;
    db = database.db("test");
    console.log("connected to DB");
  }); 
  
  io.on('connection', function(socket) {
    /*  --User Signup Functions --------------------------*/

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
                saved: [],
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
            if(result) {
              socket.emit('login_response', results);
            } else {
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

    /* Add And Review Items Functions ------------------*/

    //Add a book to review Database
    socket.on('insert', function(packet) {
      db.collection("review").findOne({isbn: packet.isbn}, function(err, results) {
        if(results || err) {
          console.log('Duplicate Book entry: ISBN found in items');
          socket.emit('book_response', 'Duplicate Book Entry')
        } else {
          db.collection("items").findOne({isbn: packet.isbn}, function(err, results) {
            if(results || err) {
              console.log('Duplicate Book entry: ISBN found in items');
              socket.emit('book_response', 'Duplicate Book Entry')
            } else {
              books.search(packet.isbn, function(error, results, apiResponse) {
                  if ( ! error ) {
                      var g = packet.genre;
                      db.collection("review").insertOne(
                        {
                          title: packet.title,
                          author: packet.author,
                          genres: g,
                          rating: 0,
                          isbn: packet.isbn,
                          googleData: results[0],
                          reviewers: []
                        }, function(err, res) {
                          if (err) throw err;
                          console.log("1 book inserted to review");
                          socket.emit('book_response', packet.title);
                      });
                  } else {
                      console.log(error);
                  }
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
              var req_c = 0;
              for (var i = 0; i < results.genres.length; i++) {
                console.log(results.genres[req_c], results.genres[i]);
                db.collection("genres").findOne({genre: results.genres[i].trim()}, function(err, gen){
                  console.log(gen, results.genres[req_c], results.genres[i]);
                  if(gen) {
                    var genre = { genre: results.genres[req_c].trim() }
                    var book = { $push: {books: packet.isbn}, $set: {thumbnail: packet.googleData.thumbnail} }
                    db.collection("genres").updateOne(genre, book, function(err, res) {
                      if (err) throw err;
                      console.log("Existing genre updated");
                    });
                  } else {
                   db.collection("genres").insertOne({genre: results.genres[req_c].trim(), books: [packet.isbn], thumbnail: packet.googleData.thumbnail }, function(err, res){
                      if (err) throw err;
                      console.log("new genre added");
                    });
                  }
                  req_c++;
                });
              }
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
    //publish a review on a book
    socket.on('publish', function(packet) {
      packet.reviewed = false;
      var query =  { isbn: packet.book};
      var review = { $push: {reviewers: packet} };
      db.collection("items").updateOne(query, review, function(err, res) {
        if (err) throw err;
        console.log("Review added");
        socket.emit('publish_response', res);
      });
    });
    //approves a review to be viewed
    socket.on('approveReview', function(packet) {
      var query = {isbn: packet.book, "reviewers.text": packet.text };
      var update = {$set: {"reviewers.$.reviewed": true}};
      db.collection("items").updateOne(query, update, function(err, result){
        if (err) throw err;
        console.log("review approved");
        db.collection("items").findOne(query, function(err, res) {
          var len = res.reviewers.length;
          console.log(len);
          var r = (res.rating*(len-1) + packet.rating)/(len);
          console.log(r);
          var rating = { $set: {rating: r}}
          db.collection("items").updateOne(query, rating, function(err, res){
              socket.emit("approveReview_response");
          });
        });
      })
    })
    //deny a book and delete it from the review database
    socket.on('deny', function(packet) {
        db.collection("review").deleteOne({isbn: packet.isbn}, function(err, results) {
          if (err) throw err;
          console.log("1 document deleted from review");
          socket.emit('deny_response', packet.title);
      });
    });
    //deny a review and delete
    socket.on("denyReview", function(packet) {
      var query = { isbn: packet.book};
      var update = {$pull: {reviewers: {text: packet.text}}};
      db.collection("items").updateOne(query, update, function(err, results) {
        if (err) throw err;
        console.log("1 document deleted from review");
        socket.emit('denyReview_response');
      });
    });
    //edit a book document in the review database
    socket.on('edit', function(packet) {
      var doc = { isbn: packet.isbn }
      var genres = packet.genres.split(",");
      var edit = {$set: {author: packet.author, title: packet.title, genres: genres}}
      db.collection("review").updateOne(doc, edit, function(err, res) {
        if (err) throw err;
        console.log("Book entry edited");
        socket.emit('edit_response');
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

  /* Search and Library Functions ----------------------*/

  //search for book/author/isbn/genre
  socket.on('search', function(query){
    var regex = new RegExp("^.*"+query+".*$", "i");
    var search = {$or: [
                    {title: regex },
                    {author: regex },
                    {genres: regex },
                    {isbn: query}
                  ]};
    db.collection("items").find(search).toArray(function(err, result) {
      if (err) throw err;
      socket.emit('search_response', result);
    });
  })
  //prompt user with existing genre tags when they enter in values
  socket.on('genre_prompt', function(prompt){
    var regex = new RegExp("^.*"+prompt+".*$", "i");
    var search = {$or: [
      {genre: regex }
    ]};
    db.collection("genres").find(search).toArray(function(err, result) {
    if (err) throw err;
    socket.emit('prompt_response', result);
    });
  })
  //save a book to user
  socket.on('save', function(packet) {
    var user = { username: packet.username }
    var book = { $push: {saved: packet} }
    db.collection("users").updateOne(user, book, function(err, res) {
      if (err) throw err;
      console.log("Book saved");
      socket.emit('save_response');
    });
  });
  //swap a library shelf
  socket.on('librarySwap', function(packet) {
    var user = { username: packet.username, "saved.book.isbn": packet.isbn}
    var book = { $set: {"saved.$.saveChoice": packet.saveChoice} }
    db.collection("users").updateOne(user, book, function(err, res) {
      if (err) throw err;
      console.log("Shelf Swapped");
      socket.emit('swap_response');
    });
  });
});
  /*Get Data Functions ----------------------*/

  //get books and reviews in review
  app.get('/review', function(req, res) {
    var data = {};
    db.collection("review").find({}).toArray(function(err, result) {
      if(err) throw err;
      data.books = result;
      db.collection("items").find({reviewers: {$elemMatch: {reviewed: false}}}).toArray(function(err, result) {
        if(err) throw err;
        data.reviews = result;
        res.json({data: data});
      });
    })
  })
  //get books in public db
  app.get('/api/books', function(req, res) {
    db.collection("items").find({}).toArray(function(err, result) {
      if(err) throw err;
      res.json(result);
    })
  })
  //get a specific book
  app.get('/api/book/details', function(req, res) {
    db.collection("items").find({isbn: req.query.isbn}).toArray(function(err, result) {
      if(err) throw err;
      res.json(result[0]);
    })
  })
  //get books from library
  app.get('/library', function(req, res) {
    db.collection("users").find({username: req.query.username}).toArray(function(err, result) {
      if(err) throw err;
      res.json({data: result[0].saved});
    })
  })
  //get all genres data
  app.get('/api/genres', function(req, res) {
    db.collection("genres").find({}).toArray(function(err, result) {
      if(err) throw err;
      res.json(result);
    })
  });
  //get books pertaining to a certain genre
  app.get('/api/genres/genre', function(req, res) {
    db.collection("genres").find({genre: req.query.genre}).toArray(function(err, result) {
      if(err) throw err;
      var data = [];
      var req_c = 0;
      data.length = result[0].books.length;
      for(var i = 0; i < result[0].books.length; i++) {
        db.collection("items").find({isbn: result[0].books[i]}).toArray(function(err, resu) {
          if(err) throw err
          data[req_c] = resu[0];
          req_c++;
          if(req_c == result[0].books.length) {
            res.json(data);
          } 
        });
      }
    })
  });
  app.get('/', function(req, res){
    res.send("Running");
  });

//  app.use(app.static('public'));
/*
  app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'app/src') + '/index.html');
  });

  app.get('/home', function(req, res) {
    res.sendFile(path.join(__dirname, 'app/src') + '/index.html');
  });
  app.get('/browse', function(req, res) {
    res.sendFile(path.join(__dirname, 'app/src') + '/index.html');
  });
  app.get('/admin', function(req, res) {
    res.sendFile(path.join(__dirname, 'app/src') + '/index.html');
  });
  app.get('/Mylibrary', function(req, res) {
    res.sendFile(path.join(__dirname, 'app/src') + '/index.html');
  });

  app.get( /[0-9]/, function(req, res) {
    res.sendFile(path.join(__dirname, 'app/src') + '/index.html');
  });
*/
  app.listen(PORT, () => {
    console.log('\nServer up on *:3000');
  });
}
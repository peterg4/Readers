// server init + mods
var app = require('express')();
var http = require('http').Server(app);
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://gpeterson:popper42@readers-csf57.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  console.log('Connected to DataBase', collection);
  client.close();
});

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile('/index.html');
});

app.use(express.static('public'));

http.listen(3000, function(){
    console.log('\nServer up on *:3000');
  });

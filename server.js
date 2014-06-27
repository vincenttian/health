// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'vincenttiannodeauthentication'
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);

// database ====================================================================

// Development

mongoose.connect("mongodb://localhost:27017/health");
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect("mongodb://localhost:27017/health", function(err, db) {
    if (!err) {
        console.log("MongoDB is connected");
    }
});

// Production
/*
var mongoUri = process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/mydb';
mongoose.connect(mongoUri);
var mongo = require('mongodb');
mongo.Db.connect(mongoUri, function(err, db) {
    db.collection('mydocs', function(er, collection) {
        collection.insert({
            'mykey': 'myvalue'
        }, {
            safe: true
        }, function(er, rs) {});
    });
});
*/
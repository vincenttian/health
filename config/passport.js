var Fitbit = require('fitbit');
var client;

var async = require("async");

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FitbitStrategy = require('passport-fitbit').Strategy;
var JawboneStrategy = require('passport-oauth').OAuth2Strategy;

// load up the user model
var User = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
            // asynchronous
            process.nextTick(function() {
                User.findOne({
                    'local.email': email
                }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);
                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    if (!user.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                    // all is well, return user
                    else
                        return done(null, user);
                });
            });
        }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
            // asynchronous
            process.nextTick(function() {
                // if the user is not already logged in:
                if (!req.user) {
                    User.findOne({
                        'local.email': email
                    }, function(err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);
                        // check to see if theres already a user with that email
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                        } else {
                            // create the user
                            var newUser = new User();
                            newUser.local.email = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.save(function(err) {
                                if (err)
                                    throw err;

                                return done(null, newUser);
                            });
                        }
                    });
                    // if the user is logged in but has no local account...
                } else if (!req.user.local.email) {
                    // ...presumably they're trying to connect a local account
                    var user = req.user;
                    user.local.email = email;
                    user.local.password = user.generateHash(password);
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                } else {
                    // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                    return done(null, req.user);
                }
            });
        }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function(req, token, refreshToken, profile, done) {
            // asynchronous
            process.nextTick(function() {
                // check if the user is already logged in
                if (!req.user) {
                    User.findOne({
                        'facebook.id': profile.id
                    }, function(err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.facebook.token) {
                                user.facebook.token = token;
                                user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = (profile.emails[0].value || '').toLowerCase();
                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }
                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser = new User();
                            newUser.facebook.id = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session
                    user.facebook.id = profile.id;
                    user.facebook.token = token;
                    user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = (profile.emails[0].value || '').toLowerCase();
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
            });
        }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({
            consumerKey: configAuth.twitterAuth.consumerKey,
            consumerSecret: configAuth.twitterAuth.consumerSecret,
            callbackURL: configAuth.twitterAuth.callbackURL,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, token, tokenSecret, profile, done) {
            // asynchronous
            process.nextTick(function() {
                // check if the user is already logged in
                if (!req.user) {
                    User.findOne({
                        'twitter.id': profile.id
                    }, function(err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.twitter.token) {
                                user.twitter.token = token;
                                user.twitter.username = profile.username;
                                user.twitter.displayName = profile.displayName;
                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }
                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser = new User();
                            newUser.twitter.id = profile.id;
                            newUser.twitter.token = token;
                            newUser.twitter.username = profile.username;
                            newUser.twitter.displayName = profile.displayName;
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session
                    user.twitter.id = profile.id;
                    user.twitter.token = token;
                    user.twitter.username = profile.username;
                    user.twitter.displayName = profile.displayName;
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
            });
        }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
            clientID: configAuth.googleAuth.clientID,
            clientSecret: configAuth.googleAuth.clientSecret,
            callbackURL: configAuth.googleAuth.callbackURL,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function(req, token, refreshToken, profile, done) {
            // asynchronous
            process.nextTick(function() {
                // check if the user is already logged in
                if (!req.user) {
                    User.findOne({
                        'google.id': profile.id
                    }, function(err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.google.token) {
                                user.google.token = token;
                                user.google.name = profile.displayName;
                                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }
                            return done(null, user);
                        } else {
                            var newUser = new User();
                            newUser.google.id = profile.id;
                            newUser.google.token = token;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session
                    user.google.id = profile.id;
                    user.google.token = token;
                    user.google.name = profile.displayName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                }
            });
        }));

    // =========================================================================
    // FitBit ==================================================================
    // =========================================================================
    passport.use(new FitbitStrategy({
            consumerKey: configAuth.fitbitAuth.clientID,
            consumerSecret: configAuth.fitbitAuth.clientSecret,
            callbackURL: configAuth.fitbitAuth.callbackURL
        },
        function(token, tokenSecret, profile, done) {

            // console.log(profile); // includes date of birth, country, avatar, distance unit, gender, height, member since, stride length running, stride length walking, weight

            client = new Fitbit(
                configAuth.fitbitAuth.clientID,
                configAuth.fitbitAuth.clientSecret, { // Now set with access tokens
                    accessToken: token,
                    accessTokenSecret: tokenSecret,
                    unitMeasure: 'en_US'
                }
            );

            async.series([

                function(callback) {
                    client.getActivities(function(err, activities) {
                        callback(null, activities);
                    });
                },
                function(callback) {
                    client.getDevices(function(err, devices) {
                        callback(null, devices);
                    });
                },
                function(callback) {
                    client.getSleep(function(err, sleep) {
                        callback(null, sleep);
                    });
                },
                function(callback) {
                    client.getBodyFat(function(err, r) {
                        callback(null, r);
                    });
                },
                function(callback) {
                    client.getBodyWeight(function(err, re) {
                        callback(null, re);
                    });
                },
                function(callback) {
                    client.getFoods(function(err, res) {
                        callback(null, res);
                    });
                },
                function(callback) {
                    client.getBodyMeasurements(function(err, resp) {
                        callback(null, resp);
                    });
                },
                function(callback) {
                    client.apiCall('http://api.fitbit.com/1/user/-/profile.json', function(err, resp) {
                        callback(null, resp);
                    });
                },
                function(callback) {
                    client.apiCall('http://api.fitbit.com/1/user/-/activities.json', function(err, resp) {
                        callback(null, resp);
                    });
                },
                function(callback) {
                    client.apiCall('http://api.fitbit.com/1/user/-/activities/steps/date/today/6m.json', function(err, resp) {
                        callback(null, resp);
                    });
                },
                function(callback) {
                    client.apiCall('http://api.fitbit.com/1/user/-/sleep/minutesAsleep/date/today/6m.json', function(err, resp) {
                        callback(null, resp);
                    });
                }
            ], function(err, results) {
                var info = {};
                info['activities'] = results[0];
                info['devices'] = results[1];
                info['sleep'] = results[2];
                info['bodyfat'] = results[3];
                info['bodyweight'] = results[4];
                info['foods'] = results[5];
                info['bodymeasurements'] = results[6];
                info['additional'] = results[7];
                info['stats'] = results[8];
                info['stepsovertime'] = results[9];
                info['sleepovertime'] = results[10];
                // console.log(info);
                process.nextTick(function() {
                    User.findOne({
                        $or: [{
                            'facebook.name': profile._json.user.fullName
                        }, {
                            'twitter.displayName': profile._json.user.fullName
                        }, {
                            'google.name': profile._json.user.fullName
                        }]
                    }, function(err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.fitbit.token) {
                                user.fitbit.token = token;
                                user.fitbit.name = profile.displayName;
                                user.fitbit.data = JSON.stringify(info);
                                // user.fitbit.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                                user.save(function(err) {
                                    if (err)
                                        throw err;
                                    return done(null, user);
                                });
                            }
                            return done(null, user);
                        } else {
                            var newUser = new User();
                            newUser.fitbit.id = profile.id;
                            newUser.fitbit.token = token;
                            newUser.fitbit.name = profile.displayName;
                            newUser.fitbit.data = JSON.stringify(info);
                            // newUser.fitbit.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                });
            });
        }
    ));

    // =========================================================================
    // Jawbone =================================================================
    // =========================================================================
    passport.use('jawbone', new JawboneStrategy({
            clientID: configAuth.jawboneAuth.clientID,
            clientSecret: configAuth.jawboneAuth.clientSecret,
            callbackURL: configAuth.jawboneAuth.callbackURL,
            authorizationURL: configAuth.jawboneAuth.authorizationURL,
            tokenURL: configAuth.jawboneAuth.tokenURL,
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, token, tokenSecret, profile, done) {
            process.nextTick(function() {
                // set up jawbone api access        
                var options = {
                    'client_id': configAuth.jawboneAuth.clientID,
                    'client_secret': configAuth.jawboneAuth.clientSecret,
                    'access_token': token
                }
                up = require('jawbone-up')(options);
                up.me.get({}, function(err, body) {
                    up_me = JSON.parse(body);
                    global.userName = up_me.data.first + ' ' + up_me.data.last;
                    profile = up_me['data'];
                    if (err) throw (err);

                    async.series([

                        function(callback) {
                            up.events.body.get({}, function(err, body_comp) {
                                callback(null, body_comp);
                            });
                        },
                        function(callback) {
                            up.events.cardiac.get({}, function(err, cardiac) {
                                callback(null, cardiac);
                            });
                        },
                        function(callback) {
                            up.sleeps.get({}, function(err, sleep) {
                                callback(null, sleep);
                            });
                        },
                        function(callback) {
                            up.goals.get({}, function(err, goals) {
                                callback(null, goals);
                            });
                        },
                        function(callback) {
                            up.trends.get({}, function(err, trends) {
                                callback(null, trends);
                            });
                        },
                        function(callback) {
                            up.workouts.get({}, function(err, workouts) {
                                callback(null, workouts);
                            });
                        }
                    ], function(err, results) {
                        var user_info = {};
                        user_info['body_comp'] = results[0];
                        user_info['cardiac'] = results[1];
                        user_info['sleep'] = results[2];
                        user_info['goals'] = results[3];
                        user_info['trends'] = results[4];
                        user_info['workouts'] = results[5];
                        // console.log(user_info);
                        if (!req.user) {
                            User.findOne({
                                'jawbone.id': profile.xid
                            }, function(err, user) {
                                if (err)
                                    return done(err);
                                if (user) {
                                    // if there is a user id already but no token (user was linked at one point and then removed)
                                    if (!user.jawbone.token) {
                                        user.jawbone.token = token;
                                        user.jawbone.name = profile.first + ' ' + profile.last;
                                        user.jawbone.data = JSON.stringify(user_info);
                                        // user.jawbone.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                                        user.save(function(err) {
                                            if (err)
                                                throw err;
                                            return done(null, user);
                                        });
                                    }
                                    return done(null, user);
                                } else {
                                    var newUser = new User();
                                    newUser.jawbone.id = profile.xid;
                                    newUser.jawbone.token = token;
                                    newUser.jawbone.name = profile.first + ' ' + profile.last;
                                    newUser.jawbone.data = JSON.stringify(user_info);
                                    // newUser.jawbone.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                                    newUser.save(function(err) {
                                        if (err)
                                            throw err;
                                        return done(null, newUser);
                                    });
                                }
                            });
                        } else {
                            // user already exists and is logged in, we have to link accounts
                            var user = req.user; // pull the user out of the session
                            user.jawbone.id = profile.xid;
                            user.jawbone.token = token;
                            user.jawbone.name = profile.first + ' ' + profile.last;
                            user.jawbone.data = JSON.stringify(user_info);
                            // user.jawbone.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }
                    })
                });
            });
        }
    ));
};
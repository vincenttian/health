var User = require('./models/user');

module.exports = function(app, passport) {

    // normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        User.findOne({
            'fitbit.token': req.user.fitbit.token
        }, function(err, user) {
            if (err) return err;
            var data = JSON.parse(user.fitbit.data);
            data.stepsovertime = JSON.parse(data.stepsovertime);
            res.json({
                fitbitdata: data.stepsovertime
            })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =============================================================================
    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function(req, res) {
        res.render('login.ejs', {
            message: req.flash('loginMessage')
        });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', {
            message: req.flash('signupMessage')
        });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: 'email'
    }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter', {
        scope: 'email'
    }));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // fitbit ---------------------------------

    // send to fitbit to do the authentication
    app.get('/auth/fitbit',
        passport.authenticate('fitbit'));

    // the callback after fitbit has authenticated the user
    app.get('/auth/fitbit/callback',
        passport.authenticate('fitbit', {
            failureRedirect: '/'
        }),
        function(req, res) {
            res.redirect('/profile');
        });

    // jawbone ---------------------------------

    // send to jawbone to do the authentication
    app.get('/auth/jawbone', passport.authenticate('jawbone', {
        scope: ['basic_read', 'extended_read', 'friends_read', 'move_read', 'sleep_read', 'meal_read', 'location_read', 'weight_read', 'cardiac_read']
    }));

    // the callback after jawbone has authenticated the user
    app.get('/auth/jawbone/callback',
        passport.authenticate('jawbone', {
            failureRedirect: '/'
        }), function(req, res) {
            res.redirect('/profile');
        });

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function(req, res) {
        res.render('connect-local.ejs', {
            message: req.flash('loginMessage')
        });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', {
        scope: 'email'
    }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', {
        scope: 'email'
    }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', {
        scope: ['profile', 'email']
    }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // fitbit ---------------------------------

    // send to fitbit to do the authentication
    app.get('/connect/fitbit', passport.authorize('fitbit', {
        scope: ['profile', 'email']
    }));

    // the callback after fitbit has authorized the user
    app.get('/connect/fitbit/callback',
        passport.authorize('fitbit', {
            failureRedirect: '/'
        }),
        function(req, res) {
            console.log('GOT TO CONNECT FITBIT');
            console.log(req);
            console.log(res);
            res.redirect('/profile');
        });

    // jawbone ---------------------------------

    // send to jawbone to do the authentication
    app.get('/connect/jawbone', passport.authorize('jawbone', {
        scope: ['basic_read', 'extended_read', 'friends_read', 'move_read', 'sleep_read', 'meal_read', 'location_read', 'weight_read', 'cardiac_read']
    }));

    // the callback after jawbone has authorized the user
    app.get('/connect/jawbone/callback',
        passport.authorize('jawbone', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function(req, res) {
        var user = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // fitbit ---------------------------------
    app.get('/unlink/fitbit', function(req, res) {
        var user = req.user;
        user.fitbit.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // jawbone ---------------------------------
    app.get('/unlink/jawbone', function(req, res) {
        var user = req.user;
        user.jawbone.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });



    // Route for 404 errors ---------------------
    app.get('*', function(req, res) {
        res.render('404.ejs');
    });

};

// route middleware to ensure user is logged in

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
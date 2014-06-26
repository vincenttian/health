// config/auth.js

// Development
// var base_url = 'http://localhost:3000';

// Production
var base_url = 'http://navihealth.herokuapp.com';

module.exports = {

    'facebookAuth': {
        'clientID': '842689799094193', // your App ID
        'clientSecret': '679015b1097370d23f7b069e821dbc63', // your App Secret
        'callbackURL': base_url + '/auth/facebook/callback'
    },

    'twitterAuth': {
        'consumerKey': 'v4xeuxdGt3GNPyKw22GACU3Lv',
        'consumerSecret': 'zUoo8N5ck1qDhaZFW0GTuAjlFsaRCJHe1UPkeCtdC3T7AqgLIF',
        'callbackURL': base_url + '/auth/twitter/callback'
    },

    'googleAuth': {
        'clientID': '888273576916-85ltae1ntnp61enhlmntli9dmbaqctvl.apps.googleusercontent.com',
        'clientSecret': 'nCDv10Vt2xTKT8s6ZkJk92Cz',
        'callbackURL': base_url + '/auth/google/callback'
    },

    'fitbitAuth': {
        'clientID': 'acfd53ddc2a643ddb9af80543d8ac162',
        'clientSecret': '546f759f293c4f96949d1d9bdaaeec69',
        'callbackURL': base_url + '/auth/fitbit/callback'
    },
    'jawboneAuth' : {
	       'clientID' 	  : 'iSXzETyUd3o', // your App ID
	       'clientSecret' 	  : 'e41676deb8ac04bfe08a4ae30960758f', // your App Secret
	       'authorizationURL' : 'https://jawbone.com/auth/oauth2/auth',
	       'tokenURL'         : 'https://jawbone.com/auth/oauth2/token',
	       'callbackURL' 	  : base_url + '/auth/jawbone/callback'
	},

};

var passport = module.exports = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

var config = require('../config')
  , db = require('../lib/db');

// Passport auth
passport.use(new TwitterStrategy(config.twitter_auth,
  function(token, tokenSecret, profile, done) {
    db.User.findOne({uid: profile.id}, function(err, user) {
      if(user) {
        done(null, user);
      } else {
        user = new db.User();
        user.provider = "twitter";
        user.uid = profile.id;
        user.name = profile.displayName;
        user.image = profile._json.profile_image_url;
        user.save(function(err) {
          if(err) { throw err; }
          done(null, user);
        });
      }
    });
  }
));

// Setup user serialization
passport.serializeUser(function(user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function(uid, done) {
  db.User.findOne({uid: uid}, function (err, user) {
    done(err, user);
  });
});


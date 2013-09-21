
/**
 * Module dependencies.
 */

var express = require('express')
  , path = require('path')
  , http = require('http')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

var Schema = mongoose.Schema;

var config = require('./config.js')
  , routes = require('./routes')
  , user = require('./routes/user');

var app = express();

//Set up mongoose
var UserSchema = new Schema({
    provider: String,
    uid: String,
    name: String,
    image: String,
    created: {type: Date, default: Date.now}
});
mongoose.connect('mongodb://localhost/shell-golf');
mongoose.model('User', UserSchema);

//Passport Auth
var User = mongoose.model('User');
passport.use(new TwitterStrategy({
    consumerKey: config.twitter_auth.key,
    consumerSecret: config.twitter_auth.secret,
    callbackURL: config.twitter_auth.callback_url
  },
  function(token, tokenSecret, profile, done) {
    User.findOne({uid: profile.id}, function(err, user) {
        if(user) {
            done(null, user);
        } else {
            user = new User();
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

//User serialization
passport.serializeUser(function(user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function(uid, done) {
  User.findOne({uid: uid}, function (err, user) {
    done(err, user);
  });
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect: '/',
                                       failureRedirect: '/' }));
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

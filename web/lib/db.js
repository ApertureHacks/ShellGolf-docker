var config = require('../config.js')
  , mongoose = require('mongoose');

Schema = mongoose.Schema;

UserSchema = new Schema({
    provider: String,
    uid: String,
    name: String,
    image: String,
    created: {type: Date, default: Date.now}
});

CourseSchema = new Schema({
  id_number: Number
, name: String
, description: String
, instructions: String
, start_text: String
});

mongoose.connect(config.database.uri, { 'user': config.database.user
                                      , 'pass': config.database.pass });

exports.User = mongoose.model('User', UserSchema);
exports.Course = mongoose.model('Course', CourseSchema);

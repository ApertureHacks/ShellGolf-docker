var config = require('../config.js')
  , mongoose = require('mongoose');

var Schema = mongoose.Schema;

/*
 * provider: oauth provider used to create the account. Currently only twitter.
 * uid: uid from twitter.
 * name: the users real name, e.g. "John Smith".
 * image: url for their profile picture.
 * is_admin: specifies if the user is a site admin.
 * is_author: specifies if the user can create new challenges.
 */
var UserSchema = new Schema({
  provider: String
, uid: String
, name: String
, image: String
, is_admin: {type: Boolean, default: false}
, is_author: {type: Boolean, default: false}
, created: {type: Date, default: Date.now}
});

/*
 * name: name of the file relative to it's directory, i.e. "file.txt"
 * contents: the contents of the file
 */
var FilesSchema = new Schema({
  name: String
, contents: String
});

/*
 * owner: ObjectId of the user who created the challenge
 * name: human readable name for the challenge.
 * description: description of the challenge.
 * instructions: instructions for the user attempting the challenge.
 * start: List of FilesSchemas describing the start state of the file system
 * end: List of FilesSchemas describing the end state of the file system
 */
var ChallengeSchema = new Schema({
  owner: {type: Schema.ObjectId, ref: 'User'}
, name: String
, rev: {type: Number, default: 0}
, description: String
, instructions: String
, start: [FilesSchema]
, end: [FilesSchema]
});

mongoose.connect(config.db.uri, config.db);

exports.User = mongoose.model('User', UserSchema);
exports.Challenge = mongoose.model('Challenge', ChallengeSchema);
exports.ChallengeSchema = mongoose.model('Challenge', ChallengeSchema);

var config = require('../config.js')
  , mongoose = require('mongoose');

Schema = mongoose.Schema;

/*
 * provider: oauth provider used to create the account. Currently only twitter.
 * uid: uid from twitter.
 * name: the users real name, e.g. "John Smith"
 * image: url for their profile picture.
 */
UserSchema = new Schema({
  provider: String
, uid: String
, name: String
, image: String
, is_admin: {type: Boolean, default: false}
, created: {type: Date, default: Date.now}
});


/*
 * id_number: incrementing id number. FIXME: do we even need this?
 * name: human readable name for the course.
 * description: description of the course
 * instructions: instructions for the user attempting the course
 * start_text: Text describing the inital state of the file system. Should be
 *             removed in favor of dynamically generated text.
 */
CourseSchema = new Schema({
  id_number: Number
, name: String
, description: String
, instructions: String
, start_text: String
});

mongoose.connect(config.db.uri, config.db);

exports.User = mongoose.model('User', UserSchema);
exports.Course = mongoose.model('Course', CourseSchema);

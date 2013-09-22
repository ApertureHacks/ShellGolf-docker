
/*
 * GET courses
 */

var zmq = require('../lib/zmq_client');

exports.course = function(req, res){
  var numeric_id = req.params[0];
  var Course = mongoose.model('Course', CourseSchema);

  Course.findOne({numeric_id: numeric_id}, function(err, course){
    if (err) {
      res.send("Error connecting to database.");
    }
    res.render('course', { title: 'Shell Golf',
                           user: req.user,
                           course: course});
  });
};

exports.submit = function(req, res){
  var numeric_id = req.params.id_number;
  var commands = req.query.commands;

  // Replace newlines with semicolons
  commands = commands.replace('\n', '; ');

  var result = zmq.zmq_client(req.session.user.uid, numeric_id, commands);

  // FIXME: figure out out to send failure AJAX response
  res.send("success or something");
};

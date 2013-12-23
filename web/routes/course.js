// GET courses

var zmq = require('../lib/zmq_client')
  , db = require('../lib/db');

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
  var commands = req.body.commands;

  // Replace newlines with semicolons
  commands = commands.replace('\n', '; ');
  zmq.zmq_client(req.user.uid, numeric_id, commands, function(result){
    console.log("Got result: " + result.toString());
    // res.contentType('json');
    res.write('{"success": ' + result.toString() + '}');
    res.end();
  });
  // FIXME: store the result somewhere
};

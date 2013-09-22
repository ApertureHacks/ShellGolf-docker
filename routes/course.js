
/*
 * GET courses
 */

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
  res.send("success or something");
};

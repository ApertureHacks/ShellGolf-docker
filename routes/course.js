
/*
 * GET courses
 */

exports.course = function(req, res, numeric_id){
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

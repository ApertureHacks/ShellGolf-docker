
/*
 * GET home page.
 */

exports.index = function(req, res){
  var courses_list;
  // FIXME: should this be somewhere else?
  var Course = mongoose.model('Course', CourseSchema);

  Course.find({}, function(err, courses){
    if (err) {
      res.send("Error connecting to database.");
    }
    res.render('index', { title: 'Shell Golf',
                          user: req.user,
                          courses: courses});
  });
};

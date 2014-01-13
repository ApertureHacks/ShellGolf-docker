var fs = require('fs');
var walk = require('walkdir');

exports.verifySolution = function(submission_path, solution, done) {
  var matched_files = 0;

  var emitter = walk(submission_path);

  emitter.on('file', function(filename, stat) {
    var found = false;
    var relative_name = filename.replace(new RegExp('^' + submission_path + '/'), '');
    var file;
    for(file in solution) {
      file = solution[file];
      if(file.name === relative_name) {
        found = true;
        break;
      }
    }
    if(!found) {
      return this.end();
    }

    //File was found, compare contents
    fs.readFile(filename, function(err, data) {
      data = data.toString('utf8');
      var solution_contents = file.contents.replace(/\n+$/g, '');
      var submission_contents = data.replace(/\n+$/g, '');
      if(solution_contents !== submission_contents) {
        return this.end();
      }
    });

    matched_files++;
  });

  emitter.on('end', function() {
    if(matched_files !== solution.length) {
      return done(false);
    }
    return done(true);
  });
}

var fs = require('fs');
var walk = require('walkdir');

/*
 * Verifies a solution
 * @method verifySolution
 * @param {String} submission_path Path to submitted solution
 * @param {Array}  solution Array of files for actual solution
 * @param done {function} callback Function that takes bools or err
 */
module.exports = function(submission_path, solution, done) {
  var matched_files = 0;
  var error;

  var emitter = walk(submission_path);

  emitter.on('error', function(path, err) {
    error = err;
    emitter.end();
  });

  emitter.on('fail', function(path, err) {
    error = err;
    emitter.end();
  });

  emitter.on('file', function(filename, stat) {
    if(matched_files >= solution.length) {
      // More files than expected, triggers a fail
      error = true;
      return emitter.end();
    }

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
      return emitter.end();
    }

    //File was found, compare contents
    fs.readFile(filename, function(err, data) {
      data = data.toString('utf8');
      var solution_contents = file.contents.replace(/\n$/g, '');
      var submission_contents = data.replace(/\n$/g, '');
      if(solution_contents !== submission_contents) {
        error = true;
        return emitter.end();
      }
    });

    matched_files++;
  });

  emitter.on('end', function() {
    if(error) {
      return done(false, error);
    }
    if(matched_files !== solution.length) {
      return done(false);
    }
    return done(true);
  });
};

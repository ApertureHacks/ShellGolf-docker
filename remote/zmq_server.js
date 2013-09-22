var zmq = require('zmq');

var responder = zmq.socket('rep');

responder.on('message', function(request) {
  console.log("Received request: " + request.toString());
  var reponse = { "user": request.user,
                  "success": execute_cmds(request)
  };
  setTimeout(function() {
    // send reply back to client.
    responder.send(response);
  }, 1000);
});

responder.bind('tcp://*:5555', function(err) {
  if(err) { console.log(err); }
  else { console.log("Listening on 5555..."); }
});

process.on('SIGINT', function() {
  responder.close();
});

function execute_cmds(request) {
  var sys = require('sys')
    , exec = require('child_process').exec
    , container = null
    , success = false;

  //Set up stdout
  function puts(error, stdout, stderr) { sys.puts(stdout); }

  //Begin execution
  exec("docker run -d course-" + request.course_id + " bash -c '" + request.cmds + "'",
       function(error, stdout, stderr) {
         container = stdout.toString();
  });

  if(container) {
    //FIXME: Wait for run to finish
    exec("docker cp " + container + ":/home/golfer ./" + request.epoch, puts);
    exec("./course-" + request.course + " ./" + request.epoch,
         function(error, stdout, stderr) {
           if(error && error.code === 0) {
             success = true;
           }
    });
    exec("rm -rf ./" + request.epoch);
  }
  return success;
}

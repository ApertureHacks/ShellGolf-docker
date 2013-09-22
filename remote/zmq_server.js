var zmq = require('zmq');

var responder = zmq.socket('rep');

responder.on('message', function(request) {
  request = JSON.parse(request);
  console.log("Received request: " + request.toString());
  var response = { "user": request.user,
                  "success": execute_cmds(request)
  };
  setTimeout(function() {
    // send reply back to client.
    responder.send(JSON.stringify(response));
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
  console.log("Executing docker command:");
  console.log("$ docker run -d course-" + request.course_id + " bash -c '" + request.cmds + "'");
  exec("docker run -d course-" + request.course_id + " bash -c '" + request.cmds + "'",
       function(error, stdout, stderr) {
         container = stdout.toString();
  });

  if(container) {
    //FIXME: Wait for run to finish
    console.log("Extracting result from container:");
    console.log("$ docker cp " + container + ":/home/golfer ./" + request.epoch);
    exec("docker cp " + container + ":/home/golfer ./" + request.epoch, puts);

    console.log("Running verification:");
    console.log("./course-" + request.course + " ./" + request.epoch);
    exec("./course-" + request.course + " ./" + request.epoch,
         function(error, stdout, stderr) {
           if(error && error.code === 0) {
             success = true;
           }
    });
    console.log("Removing verification directory.");
    exec("rm -rf ./" + request.epoch);
  }
  return success;
}

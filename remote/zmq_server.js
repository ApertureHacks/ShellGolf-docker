var zmq = require('zmq')
  , sys = require('sys')
  , exec = require('child_process').exec
  , container = null
  , success = false;

var responder = zmq.socket('rep');

responder.on('message', function(request) {
  request = JSON.parse(request);
  console.log("Received request: " + request.toString());
  var response = { "user": request.user,
                   "success": false
                 };
  execute_cmds(request, response);
});

responder.bind('tcp://*:5555', function(err) {
  if(err) { console.log(err); }
  else { console.log("Listening on 5555..."); }
});

process.on('SIGINT', function() {
  responder.close();
});

//Set up stdout
function puts(error, stdout, stderr) { sys.puts(stdout); }

function execute_cmds(request, response) {
  //Begin execution
  console.log("Executing docker command:");
  console.log("$ docker run -d course-" + request.course_id + " bash -c '" + request.cmds + "'");
  exec("docker run -d course-" + request.course_id + " bash -c '" + request.cmds + "'",
      function(error, stdout, stderr) {
        container = stdout.toString().trim();
        if (error && error.code !== 0) {
          console.log("Error running docker");
          console.log(stderr.toString());
          responder.send(JSON.stringify(response));
        } else {
          check_process(container, request, response);
        }
      });
}

// verify that the container has finished before running verifications
function check_process(container, request, response){
  exec("docker ps -notrunc -q", function(error, stdout, stderr){
    if (stdout.indexOf(container) !== -1) {
      // the container is still running, wait a bit and check again
      setTimeout(function(){
        check_process(container, request, response);
      }, 5000);
    } else {
      extract_result(container, request, response);
    }
  });
}

function extract_result(container, request, response){
  console.log("Extracting result from container:");
  console.log("$ mkdir ./" + request.epoch + " && docker cp " + container + ":/root ./" + request.epoch);
  exec("mkdir ./" + request.epoch + " && docker cp " + container + ":/root ./" + request.epoch, function(error, stdout, stderr){
    if (error) {
      console.log(stderr);
    }
    verify_solution(container, request, response);
  });
}

function verify_solution(container, request, response){
  console.log("Running verification:");
  console.log("./course-" + request.course_id + ".sh ./" + request.epoch + "/root");
  exec("./course-" + request.course_id + ".sh ./" + request.epoch + "/root",
        function(error, stdout, stderr) {
          if(error && error.code === 0) {
            response.success = true;
          }
          responder.send(JSON.stringify(response));
          console.log("Removing verification directory.");
          exec("rm -rf ./" + request.epoch);
        });
}

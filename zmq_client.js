var zmq_client = function(user, course, cmds) {
  var zmq = require('zmq');

  console.log("Connecting to Docker server...");
  var requester = zmq.socket('req');

  requester.on("message", function(reply) {
    console.log(reply.toString());
    if(reply.success) {
      return true;
    }
    return false;
  });

  requester.connect("tcp://SERVERNAME:5555");

  var d = new Date();
  var request  = { "user": user,
                   "course_id": course,
                   "cmds": cmds,
                   "epoch": d.getTime()/1000
  };
  console.log("Sending request");
  requester.send(request);

  process.on('SIGINT', function() {
    requester.close();
  });
};

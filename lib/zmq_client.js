exports.zmq_client = function(user, course, cmds) {
  var zmq = require('zmq');

  console.log("Connecting to Docker server...");
  var requester = zmq.socket('req');

  requester.on("message", function(reply) {
    reply = JSON.parse(reply);
    console.log(reply);
    requester.close();
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
  requester.send(JSON.stringify(request));
};

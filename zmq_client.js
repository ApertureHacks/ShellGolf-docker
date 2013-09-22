var zmq_client = function(cmds) {
  var zmq = require('zmq');

  console.log("Connecting to Docker server...");
  var requester = zmq.socket('req');

  requester.on("message", function(reply) {
    console.log(reply.toString());
  });

  requester.connect("tcp://SERVERNAME:5555");

  console.log("Sending request");
  requester.send(cmds);

  process.on('SIGINT', function() {
    requester.close();
  });
};

var zmq = require('zmq');

var responder = zmp.socket('rep');

responder.on('message', function(request) {
  console.log("Received request: " + request.toString());
});

responder.bind('tcp://*:5555', function(err) {
  if(err) { console.log(err); }
  else { console.log("Listening on 5555..."); }
});

process.on('SIGINT', function() {
  responder.close();
});

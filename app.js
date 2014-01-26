var amqp = require('amqp')
  , Docker = require('dockerode')
  , exec = require('child_process').exec;

var config = require('./config')
  , db = require('./lib/db');

var docker = new Docker({socketPath: '/var/run/docker.sock'})
  , connection = amqp.createConnection({ host: config.rabbitmq.host });


connection.on('ready', function() {
  console.log('Connected to ' + config.rabbitmq.host);
  connection.queue('runCode', {autoDelete: true}, function(queue) {
    console.log('Subscribing to runCode.');
    queue.subscribe(function(msg) {
      try{
        // FIXME: actually run the tests.
        connection.publish(msg.responseQueue, { sub_uuid: msg.sub_uuid
                                              , result: true }, { autoDelete: true });
      } catch(e) {
        console.log('ERROR:\n' + e);
      }
    });
  });
});


/*
 * Given a challenge object as defined in lib/db.js, creates a docker
 * image to run tests for that challenge in.
 */
function createImage(challenge) {
  var name = challenge.name.replace(/ +/g, '_').toLowerCase();

  // Starting with this makes adding the other commands easier
  var createFiles = 'true';

  var file;
  for (var i = 0; i < challenge.start.files.length; i++) {
    file = challenge.start.files[i];
    console.log(file);
    createFiles = createFiles + ' && mkdir -p `dirname ' + file.name + '` && echo $\'' + file.contents + '\' > ' + file.name;
  }

  docker.run('jmatth/shellgolf-base', ['bash', '-c', createFiles], process.stdout, function(err, data, container) {
    if (err) {
      throw(err);
    }

    container = docker.getContainer(container.id);
    container.commit({ repo: name }, function(err, data) {
      if (err) {
        throw(err);
      }
    });
  });
}

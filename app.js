var amqp = require('amqp')
  , Docker = require('dockerode')
  , exec = require('child_process').exec;

var config = require('./config')
  , db = require('./lib/db');

var docker = new Docker({socketPath: '/var/run/docker.sock'})
  , connection = amqp.createConnection({ host: config.rabbitmq.host });



// FIXME: the dockerode pull method doesn't tag properly. just call the cli until it's fixed.
console.log('Pulling ShellGolf base image.');
exec('docker pull jmatth/shellgolf-base', function(err, stdout, stderr) {
  if (err) {
    throw (err);
  }

  db.Challenge.find().exec(function(err, challenges) {
    // FIXME: check to see if the image is already ready.
    if(err) {
      throw(err);
    }
    for (var i = 0; i < challenges.length; i++) {
      console.log('Creating image for challenge ' + challenges[i].name);
      createImage(challenges[i]);
    }

    // FIXME: better way to do this?
    connection.on('ready', subRunCode);
    if (connection.readyEmitted) subRunCode();
  });
});


/*
 * Subscribe to the queue to execute user commands.
 */
function subRunCode() {
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
}

/*
 * Given a challenge object as defined in lib/db.js, creates a docker
 * image to run tests for that challenge in.
 */
function createImage(challenge) {
  var name = challenge.name.replace(/ +/g, '_').toLowerCase() + '-' + challenge.rev;

  // Starting with this makes adding the other commands easier
  var createFiles = 'true';

  for (var i = 0; i < challenge.start.length; i++) {
    var file = challenge.start[i];
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

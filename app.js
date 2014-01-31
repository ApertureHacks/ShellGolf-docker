var amqp = require('amqp')
  , Docker = require('dockerode')
  , fs = require('fs.extra')
  , tar = require('tar')
  , exec = require('child_process').exec;

var config = require('./config')
  , verifySoltion = require('./lib/verifySolution.js')
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
        db.Challenge.findOne({_id: msg.challengeId}).exec(function(err, challenge) {
          if (err) {
            throw(err);
          }
          var containerName = challenge.name.replace(/ +/g, '_').toLowerCase() + '-' + challenge.rev;
          var containerOpts = { Image: containerName
                              , Tty: true
                              , WorkingDir: '/home/golfer'
                              , User: 'golfer'
                              , Cmd: ['/bin/bash', '-c', msg.commands]
                              , Env: ['HOME /home/golfer', 'PATH /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin']};

          docker.createContainer(containerOpts, function(err, container){
            container.attach({stream: true, stdout: true, stderr: true}, function(err, stream) {
              var output = '';
              stream.on('readable', function() {
                output += stream.read();
              });
              container.start(function(err, data) {
                var killed = false;
                var timeout = setTimeout(function() {
                  container.kill(function() {
                    killed = true;
                    console.log('container timed out for ' + msg.sub_uuid);
                    connection.publish(msg.responseQueue, { sub_uuid: msg.sub_uuid
                                                          , output: output
                                                          , result: false }, { autoDelete: true });
                    container.remove(endCallback);
                  });
                }, 30000);
                container.wait(function(err, data) {
                  if (killed) return;
                  clearTimeout(timeout);
                  extractContents(container, msg.sub_uuid, function(dir) {
                    verifySoltion(dir, challenge.end, function(success) {
                      console.log('publishing response to queue: ' + success);
                      connection.publish(msg.responseQueue, { sub_uuid: msg.sub_uuid
                                                            , output: output
                                                            , result: success }, { autoDelete: true });
                      container.remove(endCallback);
                      fs.rmrf(dir, endCallback);
                    });
                  });
                });
              });
            });
          });
        });
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

  // Sometimes it creates the files with weird permissions otherwise
  var createFiles = 'umask 022';

  for (var i = 0; i < challenge.start.length; i++) {
    var file = challenge.start[i];
    createFiles = createFiles + ' && mkdir -p `dirname ' + file.name + '` && echo $\'' + file.contents + '\' > ' + file.name;
  }

  var containerOpts = { Image: 'jmatth/shellgolf-base'
                      , WorkingDir: '/home/golfer'
                      , User: 'golfer'
                      , Cmd: ['/bin/sh', '-c', createFiles]
                      , 'Env': ['HOME /home/golfer']};
  docker.createContainer(containerOpts, function(err, container) {
    if (err) {
      throw(err);
    }

    container.attach({stream: true, stdout: true, stderr: true}, function(err, stream) {
      container.start(function(err, data) {
        if (err) {
          throw(err);
        }

        container.wait(function(err, data) {
          container.commit({ repo: name }, function(err, data){
            if(err) throw(err);
          });
        });
      });
    });
  });
}

/**
 * Extracts the contents of /home/golfer from the provided container.
 *
 * @method extractContents
 * @param {Object} container dockerode container object to extract files from.
 * @param {String} uuid UUID to name the destination directory.
 * @param {Function} callback function to be called when extracion is complete. It will be passed the path of directory where files have been extacted to.
 */
function extractContents(container, uuid, callback) {
  var dir = '/tmp/' + uuid;
  container.copy({ Resource: '/home/golfer' }, function(err, data) {
    var output = tar.Extract({ path: '/tmp/' + uuid, strip: 1 });
    data.on('readable', function() {
      output.write(data.read());
    });
    data.on('end', function() {
      output.end();
    });
    output.on('close', function() {
      callback(dir);
    });
  });
}

/**
 * Helper function that logs an error if there is one. Meant to be used as a callback.
 * @method endCallback
 * @param {Object} err Error passed in from calling function, if there is one.
 */
function endCallback(err) {
  if (err) {
    console.log(err);
  }
}

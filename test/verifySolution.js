var walk = require('walkdir')
  , fs = require('fs')
  , sinon = require('sinon')
  , EventEmitter = require('events').EventEmitter
  , verify = require('../lib/verifySolution');

var emitter;

sinon.stub(walk, 'walk', function(path) {
  emitter = new EventEmitter();
  emitter.end = sinon.spy();
  return emitter;
});

sinon.stub(fs, 'readFile');

describe('verifySolution', function() {

  afterEach(function() {
    walk.walk.reset();
    fs.readFile.reset();
  });

  it('should succeed if an empty directory was the solution', function(done) {
    var solution = [];
    verify('/tmp/testEmpty', solution, function(success) {
      success.should.be.true;
      done();
    });

    emitter.emit('end');
  });

  it('should fail if there are missing files', function(done) {
    var solution = [{ name: 'file1', contents: '' }];
    verify('/tmp/testEmpty', solution, function(success) {
      success.should.not.be.true;
      done();
    });

    emitter.emit('end');
  });

  it('should return false if there are extraneous files', function(done) {
    var solution = [];

    fs.readFile.yields(undefined, '');

    verify('/tmp/testExtraneous', solution, function(success) {
      success.should.not.be.true;
      done();
    });

    emitter.emit('file', '/tmp/testExtraneous/file1');
    emitter.emit('end');
  });

  it('should fail if there are differences in the file contents', function(done) {
    var solution = [{ name: 'file1.txt', contents: 'some content' }];
    var testDir = '/tmp/testContents';
    fs.readFile.yields(undefined, 'some different content');

    verify(testDir, solution, function(success) {
      success.should.not.be.true;
      done();
    });

    emitter.emit('file', testDir + '/file1.txt');
    emitter.emit('end');
  });

  it('should ignore differences in ending newlines', function(done) {
    var solution = [{ name: 'file1.txt', contents: 'content' }];
    var testDir = '/tmp/testTrailingNewline';
    fs.readFile.yields(undefined, 'content\n');

    verify(testDir, solution, function(success) {
      success.should.be.true;
      done();
    });

    emitter.emit('file', testDir + '/file1.txt');
    emitter.emit('end');
  });
});

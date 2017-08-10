// ./test/integration/models/User.test.js

var util = require('util');
var Promise = require('bluebird');

describe('World (model)', function () {
  describe('run()', function () {
    it('run for 10 generations', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      World.run(community, 1000);
      return done();
    });
  });
  describe('run distributed()', function () {
    it('run for 10 generations', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        var job = sails.hooks.publisher.createJob('individual', {chromosome: chromo}).save();
        return job;
      });
      World.run(community, 1000);
      return done();
    });
  });
});

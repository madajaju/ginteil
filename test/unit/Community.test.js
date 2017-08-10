// ./test/integration/models/User.test.js

var util = require('util');
var Promise = require('bluebird');

describe('Community (model)', function () {
  describe('initialize()', function () {
    it('should return n users', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      return done();
    });
    it('run the fitness function', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      return done();
    });
    it('kill Off the weaklings', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      Community.killOff(community);
      return done();
    });
    it('breed', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      return done();
    });
    it('mutate', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      return done();
    });
  });
  describe('run life', function () {
    it('Build Community', function (done) {
      var community = Community.initialize(100, 10);
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      return done();
    });
    it('1 Cycle', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      return done();
    });
    it('2 Cycle', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      Community.evaluate(community);
      return done();
    });
    it('3 Cycle', function (done) {
      var community = Community.initialize(100, 10,0.25,  function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      Community.evaluate(community);
      return done();
    });
    it('4 Cycle', function (done) {
      var community = Community.initialize(100, 10, 0.25, function (chromo) {
        return chromo[0];
      });
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      Community.evaluate(community);
      Community.killOff(community);
      Community.breed(community);
      Community.mutate(community, 3);
      Community.evaluate(community);
      return done();
    });
    it('5 Cycle', function (done) {
      var community = Community.initialize(100, 256, 0.25, function (chromo) {
        var score = 0;
        _.each(chromo, function (c) {
          var i = c.charCodeAt();
          score += i;
        });
        return score;
      });
      Community.evaluate(community);
      for(var i=0; i < 100; i++) {
        Community.killOff(community);
        Community.breed(community);
        Community.evaluate(community);
        Community.score(community);
        console.log(i + ")" + community.individuals[0].chromosome + "]" + community.score.min + " -> " + community.score.average + "->" + community.score.max);
      }
      return done();
    });
  });
})
;

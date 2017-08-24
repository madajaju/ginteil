/**
 * Community.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

// var Promise = require('bluebird');
// const fetch = require('node-fetch');
const _ = require('lodash');
const Promise = require('bluebird');
const fetch = require('node-fetch');
var semaphore = 1;

module.exports = {

  attributes: {
    individuals: {collection: 'individual', via: 'community'},
    survivalRate: {type: 'number', defaultsTo: 0.25},
    crossOvers: {type: 'number', defaultsTo: 2},
    mutationRate: {type: 'number', defaultsTo: 0.10},
    populationSize: {type: 'number', defaultsTo: 100},
    chromoSize: {type: 'number', defaultsTo: 100},
    generations: {type: "number"},
    currentGeneration: {type: "number"},
    state: {type: "string"},
    winners: {collection: 'individual', via: 'toplist'}
  },

  run: function (self) {
    console.log("Evaluating Community!");
    self.currentGeneration = 0;
    console.log("ID:", self.id);
    return Community.update({id: self.id}, {
      currentGeneration: 1,
      winners: []
    }).meta({fetch: true}).then(function (me) {
      Community.evaluate(me[0]);
      return null;
    });
  },

  evaluate: function (self) {
    Community.update({id: self.id}, {state: "Evaluating"}).then(function () {
      Community.findOne({id: self.id}).populateAll().then(function (me) {
        _.each(me.individuals, function (individual) {
          if (!individual.score) {
            Community.evalFunction(me, individual.id, individual.chromosome);
          }
        });
      });
    });
  },

  _killOff: function (self) {
    // Sort the individuals
    var sorted = _.sortBy(self.individuals, 'score');
    console.log(self.currentGeneration + ") Top Score:", sorted[0].score + " => " + sorted[0].chromosome);

    self.winners.push(sorted[0]);

    var sizeOfPopulation = sorted.length;
    var sizeOfSurvivors = Math.floor(sizeOfPopulation * self.survivalRate);
    var survivors = sorted.slice(0, sizeOfSurvivors);
    var dead = sorted.slice(sizeOfSurvivors);
    // Randomly put some back in the survivor pool from the dead.
    var sizeOfResurrected = Math.floor(sizeOfSurvivors / 10);
    for (var i = 0; i < sizeOfResurrected; i++) {
      var rnum = Math.floor(Math.random() * dead.length);
      survivors.push(dead[rnum]);
    }
    // Reassign the survivors to the new list.
    self.individuals = survivors;
    return survivors;
  },

// Randomize the individuals and then pop the off the stack.
  _breed: function (self) {
    Community._breedLoop(self);
    Community._mutate(self);
    Community._cullTwins(self);
    Community._breedLoop(self);
  },

  _breedLoop: function (self) {
    var breedPool = self.individuals.slice();
    var numberOfChildren = 2 * Math.floor(self.populationSize / self.individuals.length);
    // Randomize the breeding by randomly sorting the breeding list.
    for (var i = self.individuals.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = breedPool[i];
      breedPool[i] = breedPool[j];
      breedPool[j] = temp;
    }
    // start breeding parents.
    while (breedPool.length >= 2 && self.individuals.length < self.populationSize) {
      var parent1 = breedPool.pop();
      var parent2 = breedPool.pop();
      // Calculate the average number of maxNumberOfChildren
      var children = Community._breedCouple(numberOfChildren, self.crossOvers, parent1.chromosome, parent2.chromosome);
      _.each(children, function (child) {
        self.individuals.push(child)
      });
    }
    // Add another fake parent with a mutation.
    if (breedPool.length > 0) {
      var chromo1 = breedPool[0].chromosome;
      var chromo2 = Community._mutateIndividual(chromo1);
      var children = Community._breedCouple(numberOfChildren, self.crossOvers, chromo1, chromo2);
      _.each(children, function (child) {
        self.individuals.push(child);
      });
    }
    return self;
  },
  _cullTwins: function (self) {
    var sindiv = _.sortBy(self.individuals, "chromosome");
    var uniqSort = _.uniq(sindiv, true, function (indiv) {
      return indiv.chromosome;
    });
    self.individuals = uniqSort;
  },
  _breedCouple: function (numberOfChildren, crossOvers, chrom1, chrom2) {
    var children = [];
    var maxLength = chrom1.length;
    if (chrom2.length > maxLength) {
      maxLength = chrom2.length;
    }
    for (var i = numberOfChildren; i > 0; --i) {
      // Multiple Crossover sites.
      var newChrome1 = "";
      var newChrome2 = "";
      for (var j = 0; j < crossOvers; j++) {
        var endOfSegment = Math.floor((j + 1) * (maxLength / crossOvers));
        var startOfSegment = Math.floor(j * (maxLength / crossOvers));
        var costart = Math.floor(j * (maxLength / crossOvers)) + (Math.floor(Math.random() * maxLength / crossOvers));
        // Length calculated based on the costart and the endOfSegment. FIXME
        var length = endOfSegment - costart;
        var coend = costart + Math.floor(Math.random() * length);
        var c1a = chrom1.substring(startOfSegment, costart);
        var c1b = chrom1.substring(costart, coend);
        var c1c = chrom1.substring(coend, endOfSegment);
        var c2a = chrom2.substring(0, costart);
        var c2b = chrom2.substring(costart, coend);
        var c2c = chrom2.substring(coend, endOfSegment);
        newChrome1 += c1a + c2b + c1c;
        newChrome2 += c2a + c1b + c2c;
      }
      children.push({score: 0, chromosome: newChrome1});
      i--;
      if (i > 0) {
        children.push({score: 0, chromosome: newChrome2});
      }
    }
    return children;
  },

  _mutate: function (self) {
    _.each(self.individuals, function (individual) {
      if (!self.score) {
        var mutations = Math.floor(Math.random() * individual.chromosome.length * self.mutationRate) + 1;
        var length = individual.chromosome.length;
        for (var i = 0; i < mutations; i++) {
          individual.chromosome = Community._mutateIndividual(individual.chromosome);
        }
      }
    });
  }
  ,

  _mutateIndividual: function (chromo) {
    var length = chromo.length;
    var loc = Math.floor(Math.random() * length) + 1;
    var char = (Math.random().toString(16) + '0').slice(2, 3);
    return chromo.substr(0, loc - 1) + char + chromo.substr(loc);
  }
  ,

  score: function (self) {
    self.score = {max: -1, min: 99999999, average: 0, sum: 0, num: 0};
    _.each(self.individuals, function (individual) {
      self.score.sum += individual.score;
      if (individual.score > self.score.max) {
        self.score.max = individual.score
      }
      if (individual.score < self.score.min) {
        self.score.min = individual.score;
      }
    });
    // self.score.num = self.individuals.length;
    // self.score.average = self.score.sum / self.individuals.length;
  },

  initialize: function (opts) {
    var me = opts;
    me.currentGeneration = 1;

    return Community.create(me).meta({fetch: true}).then(function (community) {
      var retVal = community;
      var individuals = [];
      for (var i = community.populationSize; i > 0; i--) {
        var chromo = "";
        for (var j = community.chromoSize; j > 0; j--) {
          chromo += (Math.random().toString(16) + '0').slice(2, 3);
        }
        individuals.push({score: 0, chromosome: chromo, gens: 0});
      }
      return Individual.createEach(individuals).meta({fetch: true}).then(function (indivs) {
        var ids = _.map(indivs, function (indiv) {
          return indiv.id;
        });
        return Community.addToCollection(retVal.id, 'individuals').members(ids);
      }).then(function () {
        return Community.findOne({id: retVal.id}).populateAll().then(function (newC) {
          return newC;
        });
      });
    });
  },

  checkEvaluateFinished: function (self) {
    return Individual.count({score: 0, community: self.id}).then(function (numOfIndivs) {
      if (!numOfIndivs) {
        return Community.findOne({id: self.id}).populateAll().then(function (community) {
          if (semaphore == self.currentGeneration) {
            // Fire off the next generation
            if (community.currentGeneration < community.generations) {
              // Community.score(self);
              // Check if already ran the
              var currentGeneration = community.currentGeneration + 1;
              semaphore = -1;
              return Community.update({id: community.id}, {currentGeneration: currentGeneration, state: "Cycle"})
                .meta({fetch: true})
                .then(function (me) {
                  return Community.judgement(me[0]);
                }).then(function (community) {
                  semaphore = community.currentGeneration;
                  Community.evaluate(community);
                  return community;
                });
            }
            else {
              console.log("Completed");
              semaphore = 1;
              return null;
            }
          }
          else {
            return null;
          }
        })
      }
      return null;
    })
  }
  ,

  judgement: function (self) {
    return Community.findOne({id: self.id}).populateAll().then(function (me) {
      var survivors = Community._killOff(me);
      var topIndividual = survivors[0];
      Community._breed(me);
      // Only get the ones that have a score of 0
      var newIndivs = _.remove(me.individuals, function (indiv) {
        return indiv.score == 0;
      });
      return Individual.createEach(newIndivs).meta({fetch: true}).then(function (indivs) {
        _.each(indivs, function (indiv) {
          me.individuals.push(indiv);
        });
        var ids = _.map(me.individuals, function (indiv) {
          return indiv.id;
        });
        return Community.replaceCollection(self.id, 'individuals').members(ids);
      }).then(function () {
        return Community.addToCollection(self.id, 'winners').members([topIndividual.id]);
      }).then(function () {
        return Individual.destroy({
          where: {
            community: null,
            toplist: null
          }
        }).meta({fetch: true}).then(function (items) {
          console.log("Removed:", items.length)
        });
      }).then(function () {
        return Community.findOne({id: me.id}).populateAll();
      });
    });
  }
  ,

  evalFunction: function (self, id, chromo) {
    fetch("http://individual:3000?id=" + id + "&chromo=" + chromo + "&callback=http://ginteil:1337/community/finishedIndividual?id=" + id);
  }
}


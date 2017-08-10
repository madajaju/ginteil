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
    populationSize: {type: 'number', defaultsTo: 100},
    generations: {type: "number"},
    currentGeneration: {type: "number"},
    state: {type: "string"}
  },

  run: function (self, generations) {
    console.log("Evaluating Community!");
    self.generations = generations;
    self.currentGeneration = 0;
    console.log("ID:", self.id);
    return Community.update({id: self.id}, {
      generations: generations,
      currentGeneration: 1
    }).meta({fetch: true}).then(function (me) {
      console.log("ME:", me[0]);
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
      var children = Community._breedCouple(numberOfChildren, parent1.chromosome, parent2.chromosome);
      _.each(children, function (child) {
        self.individuals.push(child)
      });
    }
    // Add another fake parent with a mutation.
    if (breedPool.length > 0) {
      var chromo1 = breedPool[0].chromosome;
      var chromo2 = Community._mutateIndividual(chromo1);
      var children = Community._breedCouple(numberOfChildren, chromo1, chromo2);
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
  _breedCouple: function (numberOfChildren, chrom1, chrom2) {
    var children = [];
    var maxLength = chrom1.length;
    if (chrom2.length > maxLength) {
      maxLength = chrom2.length;
    }
    for (var i = numberOfChildren; i > 0; --i) {
      var crossOver = Math.floor(Math.random() * maxLength);
      var c1a = chrom1.substring(0, crossOver);
      var c1b = chrom1.substring(crossOver);
      var c2a = chrom2.substring(0, crossOver);
      var c2b = chrom2.substring(crossOver);
      var newChrome1 = c1a + c2b;
      var newChrome2 = c2a + c1b;
      children.push({score: 0, chromosome: newChrome1});
      i--;
      if (i > 0) {
        children.push({score: 0, chromosome: newChrome2});
      }
    }
    return children;
  },

  _mutate: function (self, mutations) {
    _.each(self.individuals, function (individual) {
      if (!self.score) {
        var length = individual.chromosome.length;
        for (var i = 0; i < mutations; i++) {
          individual.chromosome = Community._mutateIndividual(individual.chromosome);
        }
      }
    });
  },

  _mutateIndividual: function (chromo) {
    var length = chromo.length;
    var loc = Math.floor(Math.random() * length) + 1;
    var char = (Math.random().toString(36) + '0').slice(2, 3);
    return chromo.substr(0, loc - 1) + char + chromo.substr(loc);
  },

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

  initialize: function (name, popSize, chromoSize, survivalRate, evalFn) {
    var me = {name: name, individuals: [], populationSize: popSize, survivalRate: survivalRate, evalFn: evalFn, currentGeneration:1};
    return Community.create(me).meta({fetch: true}).then(function (community) {
      var retVal = community;
      var individuals = [];
      for (var i = popSize; i > 0; i--) {
        var chromo = (Math.random().toString(36) + '00000000000000000').slice(2, chromoSize + 2);
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
              var currentGeneration = community.currentGeneration+1;
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
  },

  judgement: function (self) {
    return Community.findOne({id: self.id}).populateAll().then(function (me) {
      Community._killOff(me);
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
        return Individual.destroy({where: {community: null}}).meta({fetch:true}).then(function(items) { console.log("Removed:", items.length)});
      }).then(function () {
        return Community.findOne({id: me.id}).populateAll();
      });
    });
  },

  evalFunction: function (self, id, chromo) {
    fetch("http://individual:3000?id=" + id + "&chromo=" + chromo + "&callback=http://ginteil:1337/community/finishedIndividual?id=" + id);
  }
}


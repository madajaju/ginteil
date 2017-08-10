/**
 * Individual.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    score: {type: "number"},
    chromosome: { type: "string"},
    gens: { type: "number"},
    community: {model: 'community'}
  }

};


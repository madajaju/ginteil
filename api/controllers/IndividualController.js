/**
 * IndividualController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  list: function(req, res) {
    Individual.find().then(function(indivs) {
      console.log("Individuals:", indivs);
      return res.view("individual/list", {individuals:indivs});
    });
  }

};


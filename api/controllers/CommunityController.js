/**
 * CommunityController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var Promise = require("bluebird");

module.exports = {

  submit: function(req,res) {
    return res.view("community/submit");
  },

  start: function (req, res) {
    console.log("Community Launch!");
    console.log("Community Launch!", req.query);

    Community.initialize( {name:req.query.name,
      survivalRate: req.query.survivalRate,
      crossOvers: req.query.crossOvers,
      mutationRate: req.query.mutationRate,
      populationSize: req.query.populationSize,
      chromoSize: req.query.chromoSize,
      generations: req.query.generations,
      evalFn: function (id, chromo) {
        var cid = community.id + "." + id;
        fetch("http://localhost:3000?id=" + id + "&chromo=" + chromo + "&callback=http://localhost:1337/individual/finished?id=" + cid);
      }
    }).then(function (community) {
      res.redirect('winners?id=' + community.id);
      Community.run(community, req.body);
      return community;
    });
  },

  finishedIndividual: function (req, res) {
    var id = req.query.id;
    var score = req.query.score;
    res.send("OK");
    if (id) {
      return Individual.update({id: id}, {score: score}).meta({fetch: true}).then(function (individual) {
        return Community.findOne({id: individual[0].community});
      }).then(function (community) {
          return Community.checkEvaluateFinished(community);
      });
    }
  },
	list: function(req, res) {
		Community.find().populateAll().then(function(communities) {
			return res.view('community/list', {communities:communities});
		});
	},
	winners: function(req, res) {
		var id = req.query.id;

		Community.findOne({id:id}).populateAll().then(function(community) {
			return res.view('community/winners', {community:community});
		});
	}
}
;


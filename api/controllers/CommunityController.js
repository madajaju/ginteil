/**
 * CommunityController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var Promise = require("bluebird");

module.exports = {

  start: function (req, res) {
    console.log("Community Launch!");
    Community.initialize("Mine", 100, 10, 0.25, function (id, chromo) {
      console.log("Fetching score: " + id);
      console.log("Community:" + community.id);
      var cid = community.id + "." + id;
      fetch("http://localhost:3000?id=" + id + "&chromo=" + chromo + "&callback=http://localhost:1337/individual/finished?id=" + cid);
    }).then(function (community) {
      res.send("OK");
      Community.run(community, 100);
      return community;
    });
  },

  finishedIndividual: function (req, res) {
    var id = req.query.id;
    var score = req.query.score;
    res.send("OK");
    console.log(time(), ") ID:", id);
    if (id) {
      return Individual.update({id: id}, {score: score}).meta({fetch: true}).then(function (individual) {
        return Community.findOne({id: individual[0].community});
      }).then(function (community) {
          return Community.checkEvaluateFinished(community);
      });
    }
  },
	list: function(req, res) {
		console.og("List", req);
		Community.list().then(function(communities) {
			return res.view('community/list', {communities:communities});
		});
	},
	winners: function(req, res) {
		console.og("Winners", req.query);
		var id = req.query.id;

		Community.findOne({id:id}).then(function(community) {
			return res.view('community/winners', {community:community});
		});
	}
}
;


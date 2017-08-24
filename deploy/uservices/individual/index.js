const { send } = require('micro');
const { URL, URLSearchParams } = require('url');
const fetch = require('node-fetch');

module.exports = async function (req, res) {
  var url = "http://" + req.headers.host + req.url;
  const myURL = new URL(url);
  const newSearchParams = new URLSearchParams(myURL.searchParams);
  const chromo = newSearchParams.get("chromo");
  const id = newSearchParams.get("id");
  var callback = newSearchParams.get("callback");


  var score = 0;
  var i = chromo.length;
  while (i--) {
    var c = chromo[i].charCodeAt();
    score += c;
  }
  console.log("Score:", score, ")  Chromo:", chromo);
  if(callback) {
    callback += "&score=" + score;
    const response = await fetch(callback);
    const json = await response.text();
  }
  send(res, 200, 'Got it');
}

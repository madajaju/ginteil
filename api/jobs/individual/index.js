const { send } = require('micro');
const { URL, URLSearchParams } = require('url');
const fetch = require('node-fetch');

module.exports = async function (req, res) {
  var url = "http://" + req.headers.host + req.url;
  console.log("URL:", url);
  const myURL = new URL(url);
  const newSearchParams = new URLSearchParams(myURL.searchParams);
  console.log(newSearchParams);
  const chromo = newSearchParams.get("chromo");
  const id = newSearchParams.get("id");
  var callback = newSearchParams.get("callback");

  console.log("Chromo:", chromo);
  console.log("ID:", id);

  var score = 0;
  var i = chromo.length;
  while (i--) {
    var c = chromo[i].charCodeAt();
    score += c;
  }
  console.log("Score:", score);
  if(callback) {
    callback += "&score=" + score;
    console.log("Callback:", callback);
    const response = await fetch(callback);
    const json = await response.text();
    console.log(json);
  }
  send(res, 200, 'Got it');
}

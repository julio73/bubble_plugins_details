const rp = require('request-promise');
const cheerio = require('cheerio');

rp('https://bubble.io/plugins')
  .then(content => {
    console.log(content);
  })
  .catch(function (err) {
    console.log(err);
  });

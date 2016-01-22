var https = require('https');
var url = require('url');
var env = require('env2')('./config.env');

var ampl = require('ampl');

var getReadmes = function(style, cb) {
  makeGHRequest('/orgs/dwyl/repos', data => {
    console.log(">>>>>>>>", data);
    var counter = createAsyncCounter(data.length, cb);
    data
      .map(repo => repo.full_name)
      .forEach((full_name, i) => {
        makeGHRequest(
          '/repos/' + full_name + '/readme',
          readmeData => getReadme(readmeData, i, style, full_name, counter)
        )
      });
  });
};

var getReadme = (readmeData, i, style, full_name, cb) => {
  var req = https.request(url.parse(readmeData.download_url), (res) => {
    var body = '';
    res.on('data', chunk => {
      body += chunk;
    });
    res.on('end', () => (
      ampl.parse(body, style, (html) => (
        cb({
          name: full_name.split('/')[1],
          html: html
        })
      ))
    ));
  });
  req.end();
};

var createAsyncCounter = (total, cb) => {
  var results = {};
  counted = 0;
  return (result, i) => {
    counted += 1;
    results[result.name] = result.html;
    console.log('fetched', counted, 'readmes');
    if (counted === total) cb(results);
  };
};

var makeGHRequest = function(path, cb) {
  var req = https.request(createRequestOptions(path), res => {
    var body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => cb(JSON.parse(body)));
  });
  req.end();
}

var createRequestOptions = (path) => ({
    host: 'api.github.com',
    path: path,
    method: 'GET',
    protocol: 'https:',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
      'Authorization': 'token '+ process.env.ghtoken
    }
});

module.exports = getReadmes;

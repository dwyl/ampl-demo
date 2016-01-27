var https = require('https');
var url = require('url');
var env = require('env2')('./config.env');

var ampl = require('ampl');

var getReadmes = function(style, cb) {
  makeGHRequest('/orgs/dwyl/repos?per_page=99', function(data) {
    console.log(">>>>>>>>", data);
    var counter = createAsyncCounter(data.length, cb);
    data.map(function(repo) {
      return repo.full_name;
    }).forEach(function(full_name, i) {
      makeGHRequest(
        '/repos/' + full_name + '/readme',
        function(readmeData) {
          getReadme(readmeData, i, style, full_name, counter)
        }
      );
    });
  });
};

var getReadme = function(readmeData, i, style, full_name, cb) {
  var req = https.request(url.parse(readmeData.download_url), function(res) {
    getBody(res, function(body) {
      ampl.parse(body, style, function(html) {
        cb({name: full_name.split('/')[1], html: html});
      })
    });
  });
  req.end();
};

var createAsyncCounter = function(total, cb) {
  var results = {};
  counted = 0;
  return function(result, i) {
    counted += 1;
    results[result.name] = result.html;
    console.log('fetched', counted, 'readmes');
    if (counted === total) cb(results);
  };
};

var getBody = function(res, cb) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk
    });
    res.on('end', function() {
      cb(body);
    });
}


var makeGHRequest = function(path, cb) {
  var req = https.request(createRequestOptions(path), function(res) {
    getBody(res, function(body) {
      cb(JSON.parse(body));
    });
  });
  req.on('error', console.warn)
  req.end();
}

var createRequestOptions = function(path) {
  return {
    host: 'api.github.com',
    path: path,
    method: 'GET',
    protocol: 'https:',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
      'Authorization': 'token '+ process.env.ghtoken
    }
  };
};

module.exports = getReadmes;

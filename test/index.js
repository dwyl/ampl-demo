var nock = require('nock');
var test = require('tape');

var repoReqPath = '/orgs/dwyl/repos';

var dwylRepoNames = JSON.stringify([
  {full_name:'dwyl/mocky'},
  {full_name:'dwyl/mocks'}
]);

var readmePaths = [
  '/repos/dwyl/mocky/readme',
  '/repos/dwyl/mocks/readme'
];

var ghApiUrl = 'https://api.github.com';

var readmeData = [
  JSON.stringify({download_url: ghApiUrl + '/readmeurl0'}),
  JSON.stringify({download_url: ghApiUrl + '/readmeurl1'})
];

var readmesRaw = ['hey there', ' * yo'];

var gh = function() {
  nock(ghApiUrl);
};

test('mocking!', function(t) {
  gh().get(repoReqPath).reply(200, dwylRepoNames);
  gh().get(readmePaths[0]).reply(200, readmeData[0]);
  gh().get(readmePaths[1]).reply(200, readmeData[1]);
  gh().get('/readmeurl0').reply(200, readmesRaw[0]);
  gh().get('/readmeurl1').reply(200, readmesRaw[1]);

  var server = require('../server/app.js');

  server.inject({
    method: 'POST',
    url: '/convert',
    payload: JSON.stringify({
      md: '# ampl'
    })
  }, res => {
    console.log(res.result);
    t.ok(res.result.indexOf('ampl') !== -1, 'convert endpoint contains title input')
  });

  setTimeout(function() {
    server.inject('/dwyl/mocky', res => {
      t.ok(res.result.indexOf('hey there') !== -1, 'woop');
      server.stop()
      t.end();
    });
  }, 2000);

});

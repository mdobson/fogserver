var Fog = require('thefog'),
    argo = require('argo'),
    router = require('argo-url-router'),
    http = require('http'),
    Packet = Fog.Packet;

var argoserver = argo();

argoserver
  .use(router)
  .map('/devices', function(server) {
    server
      .post('/ping/{id}', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id;
          var p = new Packet({'action':'PING'});
          fogserver.send(id, p, function(err, packet){
            env.response.body = {"ping":1};
            next(env);
          });
        });
    });
  });

var app = argoserver.build();
var server = http.createServer(app.run).listen(process.env.PORT || 3000);


var fogserver = new Fog.Server({server:server});

fogserver.on('PONG', function(data) {
  console.log('Just got ponged. Pinging.');
  var clientId = data.clientId;
  var p = new Packet({'action':'PING'});
  fogserver.send(clientId, p);
});

fogserver.on('error', function(data) {
  console.log('Packet err');
  console.log(data);
});

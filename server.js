var Fog = require('thefog'),
    argo = require('argo'),
    router = require('argo-url-router'),
    http = require('http'),
    titan = require('titan'),
    Packet = Fog.Packet;

var argoserver = argo();

argoserver
  .use(router)
  .use(function(handle) {
    handle('response', function(env, next) {
      env.response.setHeader('Access-Control-Allow-Origin', '*');
      next(env);
    });
   })
  .map('/devices', function(server) {
    server
      .post('/{id}/ping', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id;
          var p = new Packet({'action':'PING'});
          p.setClientId(id);
         fogserver.send(p, function(err, packet){
            env.response.body = {"ping":1};
            next(env);
          });
        });
      })
      .get('/', function(handle) {
        handle('request', function(env, next) {
          env.response.body = fogserver.getClients();
          next(env);
        });
      })
      .get('/{id}/state', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id;
          var p = new Packet({'action':'state'});
          p.setClientId(id);
          fogserver.send(p, function(err, packet) {
            if(err) {
              env.response.body = {'error':'error with packet'};
              env.response.statusCode = 500;
            } else {
              env.response.body = JSON.stringify(packet.getData());
              env.response.statusCode = 200;
            }
            next(env);
          });
        });
      })
      .post('/{id}/time', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id;
          //Number between 0 and 24 * 60
          env.request.getBody(function(err, body) {
            if(err) {
              env.response.statusCode = 500;
              env.response.body = {'error':'error parsing body'};
              next(env);
            } else {
              var b = JSON.parse(body.toString());
              var p = new Packet({'action':'time', 'data':{'time': b.time }});
              p.setClientId(id);
              fogserver.send(p, function(err, packet) {
                if(err) {
                  env.response.body = {'error': 'error with packet'};
                  env.response.statusCode = 500;
                } else {
                  env.response.body = JSON.stringify(packet.getData());
                  env.response.statusCode = 200;
                }
                next(env);
              });
            }
          });
        });
      })
      .post('/{id}/temp', function(handle) {
        handle('request', function(env, next) { 
          env.request.getBody(function(err, body) {
            if(err) {
              env.response.statusCode = 500;
              env.response.body = {'error':'error parsing body'};
              next(env);
            } else {
              var b = JSON.parse(body.toString());
              var id = env.route.params.id;
              var p = new Packet({'action':'temp', 'data': { 'temp': b.temp }});
              p.setClientId(id);
              fogserver.send(p, function(err, packet) {
                if(err) {
                  env.response.body = {'error':'error with packet'};
                  env.response.statusCode = 500;
                } else {
                  env.response.body = JSON.stringify(packet.getData());
                  env.response.statusCode = 200;
                }
                next(env);
              });
            }
          });
        });
      })
      .post('/{id}/start', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id; 
          var p = new Packet({'action':'start'});
          p.setClientId(id);
          fogserver.send(p, function(err, packet) {
            if(err) {
              env.response.body = {'error':'error with packet'};
              env.response.statusCode = 500;
            } else {
              env.response.statusCode = 201;
            }
            next(env);
          });
        });
      })
      .post('/{id}/stop', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id;
          var p = new Packet({'action':'stop'});
          p.setClientId(id);
          fogserver.send(p, function(err, packet) {
            if(err) {
              env.response.body = {'error':'error with packet'};
              env.response.statusCode = 500;
            } else {
              env.response.statusCode = 201;
            }
            next(env);
          });
        });
      })
      .post('/{id}/reset', function(handle) {
        handle('request', function(env, next) {
          var id = env.route.params.id;
          var p = new Packet({'action':'reset'});
          p.setClientId(id);
          fogserver.send(p, function(err, packet) {
            if(err) {
              env.response.body = {'error':'error with packet'};
              env.response.statusCode = 500;
            } else {
              env.response.statusCode = 201;
            }
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

fogserver.on('REGISTER', function(pack, ws) {
  fogserver.subscribe(ws, pack.getClientId());
});

fogserver.on('error', function(data) {
  console.log('Packet err');
  console.log(data);
});

fogserver.on('HEARTBEAT', function() {
  console.log('https://www.youtube.com/watch?v=I1sNImbI2Zw');
});

var Fog = require('thefog'),
    argo = require('argo'),
    router = require('argo-url-router'),
    http = require('http'),
    titan = require('titan'),
    ug = require('usergrid'),
    Packet = Fog.Packet;

var argoserver = argo();

var apigee = new ug.client({
  orgName:'internetofthings',
  appName:'sandbox'
});

/*
*  Function to send push notification to a specified path. Call directly.
*
*  @method sendPushToDevice
*  @public
*  @param {object} options
*  @param {function} callback
*  @return {callback} callback(err, data)
*/

ug.client.prototype.sendPushToDevice = function(options, callback) {
  if (options) {
    var notifierName = options.notifier;
    var notifierLookupOptions = {
      "type":"notifier",
      "name":options.notifier
    }
    var self = this;
    this.getEntity(notifierLookupOptions, function(error, result){
      if (error) {
        callback(error, result);
      } else {
        var pushEntity = {
          "type":options.path,
          "name":options.name
        }
        if (result.get("provider") === "google") {
              pushEntity["payloads"] = {};
              pushEntity["payloads"][notifierName] = options.message;
        } else if (result.get("provider") === "apple") {
                   pushEntity["payloads"] = {}
                   pushEntity["payloads"][notifierName] = {
              "aps": {
                  "alert":options.message,
                  "sound":options.sound
              }
           }
        }
       var entityOptions = {
         client:self,
         data:pushEntity
       };
        var notification = new ug.entity(entityOptions);
        notification.save(callback);
      }
    });
  } else {
    callback(true);
  }
}

argoserver
  //.use(router)
  .use(titan)
  .allow('*')
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

fogserver.on('lidopened', function(data) {
  console.log('lid opened');
  var options = {
    notifier:"iot",
    path:"devices;ql=/notifications",
    message:"Someone lifted the lid",
    sound:"chime"
  };
  apigee.sendPushToDevice(options, function(error, data){
  });
});

fogserver.on('cookend', function(data) {
  var options = {
    notifier:"iot",
    path:"devices;ql=/notifications",
    message:"Chili done!",
    sound:"chime"
  };
  apigee.sendPushToDevice(options, function(error, data){
  });
});

fogserver.on('HEARTBEAT', function() {
  console.log('https://www.youtube.com/watch?v=I1sNImbI2Zw');
});

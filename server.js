var Fog = require('../fogserver.js'),
    Packet = require('../wspacket.js');

var server = new Fog.Server();

server.on('PONG', function(data) {
  console.log('Just got ponged. Pinging.');
  var clientId = data.clientId;
  var p = new Packet({'action':'PING'});
  server.send(clientId, p);
});

server.on('error', function(data) {
  console.log('Packet err');
  console.log(data);
});

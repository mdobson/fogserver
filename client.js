var Fog = require('thefog'),
    Packet = Fog.Packet;

var client = new Fog.Client({'endpoint':'ws://0.0.0.0:3000'});

client.open(function() {
  console.log('Client opened!');
});

client.on('ACK', function(data) {
  var clientId = data.clientId;
  console.log('subscription acknowledged clientId:'+clientId);
  var p = new Packet({'action':'PONG'});
  client.send(p);
});

client.on('PING', function(p) {
  console.log('Just pinged by server.');
  var p2 = new Packet({'action':'ACK'});
  client.respondTo(p, p2);
});

client.on('error', function(data) {
  console.log('error');
  console.log(data);
});

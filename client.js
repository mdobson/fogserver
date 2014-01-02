var Fog = require('../fogserver.js'),
    Packet = require('../wspacket.js');

var client = new Fog.Client({'endpoint':'ws://0.0.0.0:5050/'});

client.open(function() {
  console.log('Client opened!');
});

client.on('ACK', function(data) {
  var clientId = data.clientId;
  var p = new Packet({'action':'PONG', 'data':{'clientId':clientId}});
  client.send(p);
});

client.on('PING', function(data) {
  console.log('Just pinged by server.');
});

client.on('error', function(data) {
  console.log('error');
  console.log(data);
});

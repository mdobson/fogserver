var Fog = require('thefog'),
    Client = require('intelli-chilli-client'),
    udpserver = require('./chilli-server'),
    hue = require('./hue'),
    Packet = Fog.Packet;

var client = new Fog.Client({'endpoint':'ws://thefog.herokuapp.com/'});
//var client = new Fog.Client({'endpoint':'ws://localhost:3000/'});
//var chili = new Client({address:'arduino1.local'});

setInterval(function() {
  var p = new Packet({'action':'HEARTBEAT'});
  client.send(p);
}, 3000);

client.on('error', function(data) {
  console.log('error');
  console.log(data);
});

client.open(function() {
  console.log('Client opened!');
});

client.on('ACK', function(data) {
  var clientId = data.clientId;
  console.log('subscription acknowledged');
  var p = new Packet({'action':'PONG', 'data':{'clientId':clientId}});
  client.send(p);
});

client.on('PING', function(data) {
  console.log('Just pinged by server.');
  chili.ping(function(err) {
    console.log(arguments);    
  });
});

client.on('state', function(p) {

  var state = { 
    cookTime: 0,
    cookTimeRange : [0,1440],
    cookTimeLeft: 0,
    cookTemp: 'warm',
    cookTempRange : ['warm','low','medium','high'],
    currentTemp: 25,
    lidState: 'closed',
    cooking: false,
    heaterOn: false,
    address: '28554D220500009C',
  };

  var p2 = new Packet({'action':'state',data : state});
  client.respondTo(p, p2);
});

client.on('time', function(p) {
  var p2 = new Packet({'action':'time',data : { time : p.message.data.time} });
  client.respondTo(p, p2);
});

client.on('temp', function(p) {
  var p2 = new Packet({'action':'temp',data : { temp : p.message.data.temp} });
  client.respondTo(p, p2);
});

client.on('start', function(p) {
  var p2 = new Packet({'action':'start',data : {} });
  client.respondTo(p, p2);
});

client.on('stop', function(p) {
  var p2 = new Packet({'action':'stop',data : {} });
  client.respondTo(p, p2);
});

client.on('reset', function(p) {
  var p2 = new Packet({'action':'reset',data : {} });
  client.respondTo(p, p2);
});

client.on('error', function(p) {
  var p2 = new Packet({'action':'state',data : {
    error : "Timeout reached when trying to communicate with end device."
  }});
  client.respondTo(p, p2);
});



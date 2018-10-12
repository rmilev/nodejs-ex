//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    bodyParser = require('body-parser'),
    pulse   = require('adt-pulse-simple'),
    crypto = require('crypto'),
    https = require('https');



Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))
app.use(bodyParser.json());

var Pulse = new pulse(process.env.username, process.env.password)

// Register Callbacks:
Pulse.onStatusUpdate(function(a) {
  console.log("Status updated..");
  console.log(a);
  var callUrl;

  if(a.startsWith("Armed Stay.")){
    callUrl = process.env.stay;
  }
  else if(a.startsWith("Armed Away.")){
    callUrl = process.env.away;
  }
   else if(a.startsWith("Disarmed.")){
    callUrl = process.env.off;
  }
  console.log("callUrl is "+callUrl);

  https.get(callUrl, (resp) => {
  let data = '';
  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
      data += chunk;
    });
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      console.log(JSON.parse(data).explanation);
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
});

// Login - gets all devices, zones and status and invokes callbacks:
Pulse.pulse();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('/', function (req, res) {
  res.render('index.html');
});

app.get('/pagecount', function (req, res) {
  res.send('{ pageCount: }');
});

app.post('/action', function (req, res) {
  var decipher = crypto.createDecipher('aes256', process.env.key);
  var deciphered = decipher.update(req.body['@token'], 'hex', 'utf8');
  deciphered += decipher.final('utf8');
  console.dir(req.body);
  if(deciphered !== process.env.value){
    res.send('{ status: Unauthorised }');
  }
  else if(req.body.alarm === 'away'){
    console.log('Arming away..');
    Pulse.setAlarmStateAway();
  }
  else if(req.body.alarm === 'stay'){
    console.log('Arming stay..');
    Pulse.setAlarmStateStay();
  }
  else if(req.body.alarm === 'off'){
    console.log('Disarming..');
    Pulse.setAlarmStateOff();
  }
  res.send('{ status: OK}');
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

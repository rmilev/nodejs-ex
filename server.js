//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    bodyParser = require('body-parser');
    pulse   = require('adt-pulse-simple');


Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))
app.use(bodyParser.json());

var Pulse = new pulse(process.env.username, process.env.password)

// Register Callbacks:
Pulse.onStatusUpdate(function(a) {
  console.log("Status updated..");
  console.log(a);
});

// Login - gets all devices, zones and status and invokes callbacks:
Pulse.pulse();

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.get('/', function (req, res) {
  res.render('index.html');
});

app.get('/pagecount', function (req, res) {
  res.send('{ pageCount: '+process.env.username+'}');
});

app.post('/action', function (req, res) {
  console.dir(req.body);
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

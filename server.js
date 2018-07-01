//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    bodyParser = require('body-parser');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))
<<<<<<< HEAD
app.use(bodyParser.json());
=======
app.use(bodyParser);
>>>>>>> 2fc48aff5bcf60cda071f50b7daa8a7175da7df1

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

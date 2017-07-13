var express = require('express');
var bodyParser = require('body-parser');
var cfenv = require("cfenv");
var path = require('path');
var cors = require('cors');

// Setup the required environment variables
var vcapLocal = null;
try {
  vcapLocal = require("./vcap-local.json");
}
catch (e) {}

var appEnvOpts = vcapLocal ? {vcap:vcapLocal} : {};
var appEnv = cfenv.getAppEnv(appEnvOpts);

try {
	cloudantService = appEnv.services.cloudantNoSQLDB[0];
}
catch (e) {
	console.error("Error looking up service: ", e);
}

// Setup route handlers
var records = require('./routes/records');

// Setup express middleware.
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'www')));

// REST HTTP Methods
app.get('/db/:option', records.dbOptions);
app.get('/records', records.list);
app.get('/fib', records.fib);
app.get('/loadTest', records.loadTest);
app.get('/records/:id', records.find);
app.post('/records', records.create);
app.put('/records/:id', records.update);
app.delete('/records/:id', records.remove);

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("catalog server starting on " + appEnv.url);
});

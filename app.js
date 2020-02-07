var express = require('express'),
    app = express(),
    path = require('path'),
    ibmbluemix = require('ibmbluemix'),
    config = {
        applicationRoute : "http://catalogm.mybluemix.net",
        applicationId : "1e78b548-194b-4346-b094-f6d6e52978fa"
    };

// init core sdk
ibmbluemix.initialize(config);
var logger = ibmbluemix.getLogger();

app.enable('trust proxy');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res){
    res.sendFile(__dirname + "index.html");
});

// init basics for an express app
app.use(require('./lib/setup'));
express.Router().all('*', function(req, res, next){
	if (req.secure) {
		// request was via https, so do no special handling
		next();
	} else {
		// request was via http, so redirect to https
		res.redirect('https://' + req.headers.host + req.url);
	    //next();
	}
});


//uncomment below code to protect endpoints created afterwards by MAS
//var mas = require('ibmsecurity')();
//app.use(mas);

var ibmconfig = ibmbluemix.getConfig();

logger.info('mbaas context root: '+ibmconfig.getContextRoot());

// catalog API
app.use(ibmconfig.getContextRoot(), require('./lib/services'));
// adress validator
app.use(ibmconfig.getContextRoot(), require('./lib/addressValidator'));
// send grid
app.use(ibmconfig.getContextRoot(), require('./lib/sendGrid'));
// for login
app.use(ibmconfig.getContextRoot(), require('./lib/login'));

app.listen(ibmconfig.getPort());
logger.info('Server started at port: '+ibmconfig.getPort());

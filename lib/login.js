// Modules
var router = require('express').Router();
var fs = require('fs');
var https = require('https');
var querystring = require('querystring');

// HTTP & SSL
var httpsOptions = {
	host: 'cap-sg-prd-5.integration.ibmcloud.com',
	port: '15229',
	path: '/j_security_check',
	method: 'POST',
	cert: fs.readFileSync('ssl/k9BvqOJwTae_hn2_cert.pem'),
	key: fs.readFileSync('ssl/k9BvqOJwTae_hn2_key.pem'),
	agent: false,
	rejectUnauthorized: false
};

var handler = function(req, res){
	var postData = querystring.stringify({
		'j_username':req.body.username,
		'j_password':req.body.password,
		'originalUrl':'/mopiccmobile/sb/catalogldap/inquireCatalog',
		'login': 'Login'
	});
	httpsOptions.headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': Buffer.byteLength(postData)
	};
	sendRequest(postData, req, res);
};


function sendRequest(data, query, ans) {
	callback = function(res) {
		var str = '';
		res.setEncoding('utf8');
		res.on('data', function(d) {
			str += d;
		});

		res.on('end', function() {
			console.log(str);
			var responseBody = {text:str, cookies: res.headers["set-cookie"]};
			if (query.body.itemID) {
				responseBody.itemID = query.body.itemID;
				if (query.body.nb) {
					responseBody.nb = query.body.nb;
				}
			}
			ans.json(responseBody);
		});
	};

	var req = https.request(httpsOptions, callback);
	req.write(data);
	req.on('error', function(e) {
		console.log("[LOGIN ERROR] " + JSON.stringify(e));
		ans.send(JSON.stringify(e));
	});
	req.end();
}

router.post('/login', handler);

module.exports = exports = router;

// Modules
var router = require('express').Router();
var fs = require('fs');
var https = require('https');

// HTTP & SSL
var httpsOptions = {
	// Secure Gateway
	host: 'cap-sg-prd-5.integration.ibmcloud.com',
	port: '15229',	 
	method: 'POST',

	// Keys for Secure Gateway
	cert: fs.readFileSync('ssl/k9BvqOJwTae_hn2_cert.pem'),
	key: fs.readFileSync('ssl/k9BvqOJwTae_hn2_key.pem'),
	agent: false,
	rejectUnauthorized: false
};

//HTTP & SSL pour les pictures
var httpsOptionsImages = {
	// Secure Gateway
	host: 'cap-sg-prd-5.integration.ibmcloud.com',
	port: '15229',	 
	method: 'GET',

	// Keys for Secure Gateway
	cert: fs.readFileSync('ssl/k9BvqOJwTae_hn2_cert.pem'),
	key: fs.readFileSync('ssl/k9BvqOJwTae_hn2_key.pem'),
	agent: false,
	rejectUnauthorized: false
};

// Schemas
var schemaCatalog = JSON.parse(fs.readFileSync('schemas/inquireCatalog.json'));
var schemaSingle = JSON.parse(fs.readFileSync('schemas/inquireSingle.json'));
var schemaOrder = JSON.parse(fs.readFileSync('schemas/placeOrder.json'));

// API

var SclientID = '522d157d-4b1d-4335-80de-a8e003d0c3f6';
var SpathCatalog = '/mopiccmobile/sb/catalogldap/inquireCatalog?client_id=' + SclientID;
var SpathSingle = '/mopiccmobile/sb/catalogldap/inquireSingle?client_id=' + SclientID;
var SpathOrder = '/mopiccmobile/sb/catalogldap/placeOrder?client_id=' + SclientID;
var SpathImage = '/mopiccmobile/sb/api/images?client_id=' + SclientID;
/*
var clientID = '1efcccd0-98a2-41dc-9162-e0c78f471ba1';
var pathCatalog = '/mopiccmobile/sbtest/catalogmanager/inquireCatalog?client_id=' + clientID;
var pathSingle = '/mopiccmobile/sbtest/catalogmanager/inquireSingle?client_id=' + clientID;
var pathOrder = '/mopiccmobile/sbtest/catalogmanager/placeOrder?client_id=' + clientID;
*/

var Services = {
	/**
	 * To test: curl -X POST -H 'Content-Type: application/json' -d '{}' http://catalogmanagertest.mybluemix.net/catalogmanagertest/v1/apps/bca45894-92f7-49dc-ae54-b23b89ab6c73/catalog
	 *
	 */
	inquireCatalog: function(req, res){
		// ATTENTION Ne pas utiliser la ligne suivante car cookie non transmis par IoT
		//if (!req.headers.cookie || !req.headers.cookie.match(/^LtpaToken2=/)) {
		if (!req.body.ltpa || !req.body.ltpa.match(/^LtpaToken2=/)) {
			res.setHeader('Content-Type', 'application/json');
			res.send({'LoginForm':'true'});
			return;
		}
		if (req.body.startRef==null) {
			schemaCatalog.DFH0XCMNOperation.ca_inquire_request.ca_list_start_ref = "0000";
		} else {
			schemaCatalog.DFH0XCMNOperation.ca_inquire_request.ca_list_start_ref = req.body.startRef;
		}
		
		httpsOptions.headers = {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(JSON.stringify(schemaCatalog))
		};
		if (req.secure) {
			httpsOptions.path = SpathCatalog;
			httpsOptions.headers.Cookie = req.body.ltpa;
			sendRequest(JSON.stringify(schemaCatalog), res);
		} else {
			res.setHeader('Content-Type', 'application/json');
			res.send({'LoginForm':'true'});
		}
	},

	/**
	 *
	 * To test: curl -X POST -H 'Content-Type: application/json' -d '{"itemID":"10"}' http://catalogmanagertest.mybluemix.net/catalogmanagertest/v1/apps/bca45894-92f7-49dc-ae54-b23b89ab6c73/single
	 * req: {itemID: xx}
	 */
	inquireSingle: function(req, res){
		if (!req.body.ltpa || !req.body.ltpa.match(/^LtpaToken2=/)) {
			res.setHeader('Content-Type', 'application/json');
			res.send({'LoginForm':'true'});
			return;
		}
		if (req.body.itemID==null) {
			res.send('Internal error: no itemID in request body');
		} else {
			schemaSingle.DFH0XCMNOperation.ca_inquire_single.ca_item_ref_req = req.body.itemID;
			httpsOptions.headers = {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(JSON.stringify(schemaSingle))
			};
			if (req.secure) {
				httpsOptions.path = SpathSingle;
				httpsOptions.headers.Cookie = req.body.ltpa;
				sendRequest(JSON.stringify(schemaSingle), res);
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.send({'LoginForm':'true'});
			}
			
		}
	},

	/**
	 *
	 * To test: curl -X POST -H 'Content-Type: application/json' -d '{"itemID":"10", "nb":"2"}' http://catalogmanagertest.mybluemix.net/catalogmanagertest/v1/apps/bca45894-92f7-49dc-ae54-b23b89ab6c73/order
	 * req: {itemID: xx, nb: xx}
	 */
	placeOrder: function(req, res){
		if (!req.body.ltpa || !req.body.ltpa.match(/^LtpaToken2=/)) {
			res.setHeader('Content-Type', 'application/json');
			res.send({'LoginForm':'true'});
			return;
		}
		if (req.body.itemID==null || req.body.nb==null) {
			res.send('Internal error: itemID or quantity is missing in request body');
		} else {
			schemaOrder.DFH0XCMNOperation.ca_order_request.ca_item_ref_number = req.body.itemID;
			schemaOrder.DFH0XCMNOperation.ca_order_request.ca_quantity_req = req.body.nb;
			httpsOptions.headers = {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(JSON.stringify(schemaOrder))
			};
			if (req.secure) {
				httpsOptions.path = SpathOrder;
				httpsOptions.headers.Cookie = req.body.ltpa;
				sendRequest(JSON.stringify(schemaOrder), res);
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.send({'LoginForm':'true'});
			}
		}
	},
	
	strongloopImage: function(req, res){
		if (!req.body.ltpa || !req.body.ltpa.match(/^LtpaToken2=/)) {
			res.setHeader('Content-Type', 'application/json');
			res.send({'LoginForm':'true'});
			return;
		}
		var itemRef = req.params.itemRef;
		if (req.secure) {
			httpsOptionsImages.path = SpathImage + '&filter={"fields":{"image":true},"where":{"reference":' + itemRef + '}}';
			httpsOptionsImages.headers = {Cookie: req.body.ltpa};
			callback = function(retour) {
				var str = '';
				retour.setEncoding('utf8');
				retour.on('data', function(d) {
					str += d;
				});

				retour.on('end', function() {
					if (str.match(/LoginForm/g)){
						res.setHeader('Content-Type', 'application/json');
						res.send({'LoginForm':'true'});
					} else {
						res.setHeader('Content-Type', 'application/json');
						res.send(str);
					}
				});
			};

			var reqsend = https.request(httpsOptionsImages, callback);
			reqsend.on('error', function(e) {
				console.log(JSON.stringify(e));
				res.send(JSON.stringify(e));
			});
			reqsend.end();
		} else {
			res.setHeader('Content-Type', 'application/json');
			res.send({'LoginForm':'true'});
		}
		
	}
};

function sendRequest(data, ans) {
	callback = function(res) {
		var str = '';
		res.setEncoding('utf8');
		res.on('data', function(d) {
			str += d;
		});

		res.on('end', function() {
			console.log(str);
			if (str.match(/LoginForm/g)){
				ans.setHeader('Content-Type', 'application/json');
				ans.send({'LoginForm':'true'});
			} else {
				ans.setHeader('Content-Type', 'application/json');
				ans.send(str);
			}
		});
	};

	var req = https.request(httpsOptions, callback);
	req.write(data);
	req.on('error', function(e) {
		console.log(JSON.stringify(e));
		ans.send(JSON.stringify(e));
	});
	req.end();
}

router.post('/catalog', Services.inquireCatalog);

router.post('/single', Services.inquireSingle);

router.post('/order', Services.placeOrder);

router.post('/image/:itemRef', Services.strongloopImage);

module.exports = exports = router;

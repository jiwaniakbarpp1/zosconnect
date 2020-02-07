/**
 *
 * IMPORTANT
 *
 * When calling the address validator, the request should contain a JSON with
 *  - address: required, can contain spaces, cannot contain accents/diacritics
 *             House number has to be specified
 *  - city   : required, can contain spaces, cannot contain accents/diacritics
 *  - state  : not required
 *  - pcode  : required, postal code, can contain spaces, must be numerical
 *  - country: required, ISO 3116-1 Alpha-3 country code
 *
 * Results contain a Status (OK, FAIL), with the corresponding data (AddressBlocks, Message).
 *
 */



/**
 * For local test:
 *
 * curl -X POST -H 'Content-Type: application/json' -d '{"address":"37+Executive+Dr","city":"Danbury","state":"CT","pcode":"06810","country":"USA"}' http://localhost:3000/catalogmanagertest/v1/apps/bca45894-92f7-49dc-ae54-b23b89ab6c73/validateAddress
 *
 */


// Modules
var router = require('express').Router();
var https = require('https');

// Adds the intermediary CA
require('ssl-root-cas/latest').addFile('ssl/SymantecClass3SecureServerCA-G4').inject();

var appId = "";
/*if (process.env.VCAP_SERVICES) {
    var services = JSON.parse(process.env.VCAP_SERVICES);
    for (var svcName in services) {
        if (svcName.match(/^user-provided/)) {
            var pitneyBowesCredentials = services[svcName][0]['credentials'];
            appId = pitneyBowesCredentials.appId;
        }
    }
} else {
    appId = "a7839e38-dbc7-45e8-81a9-ee9e579366dc";
}*/
var appId = "a7839e38-dbc7-45e8-81a9-ee9e579366dc";
var url = "https://pitneybowes.pbondemand.com/location/address/validate.json";

function verify(req, res){
    var address = req.body.address;
    var city = req.body.city;
    var state = req.body.state;
    var pcode = req.body.postalCode;
    var country = req.body.country;

    // test parameters
    if (!address || !city || !pcode || !country){
        res.send('Error: missing information');
        return;
    }
    if (state==null){
        state = '';
    }

    // handle spaces
    address = address.replace(/ /g,'+');
    city = city.replace(/ /g, '+');
    pcode = pcode.replace(/ /g, '');
    state = state.replace(/ /g, '+');
    country = country.replace(/ /g, '');

    var options = {
        hostname: 'pitneybowes.pbondemand.com',
        port: 443,
        path: '/location/address/validate.json?appId=' + appId + '&address=' + address + '&city=' + city + '&stateProvince=' + state + '&postalCode=' + pcode + '&country=' + country,
        method: 'GET',
        rejectUnauthorized: false
    };

    https.request(options, function(ans){
        //console.log(options);
        ans.setEncoding('utf8');
        var str = '';
        ans.on('data', function (chunk) {
            str += chunk;
        });
        ans.on('end', function() {
        	res.setHeader('Content-Type','application/json');
        	console.log("PITNEY BOWES: " + ans.statusCode);
        	var tmp;
        	if (ans.statusCode!=200) {
        		tmp = {'Status':'ERROR'};
        	} else {
	            var json = JSON.parse(str);
	            console.log("PITNEY BOWES: " + str);
	            if (json.Output.Status === 'OK' && json.Output.ParsedOutput.HouseNumber != ''){
	                tmp = {'Status':'OK', 'AddressBlocks': json.Output.AddressBlocks};
	            } else if (json.Output.Status != 'OK'){
	                tmp = {'Status':'FAIL', 'Message': json.Output.StatusDescription};
	            } else {
	                tmp = {'Status':'FAIL', 'Message': 'Please enter a house number'};
	            }
        	}
            res.send(tmp);
        });
    }).on('error', function(e){
        res.send(e);
    }).end();
}

router.post('/validateAddress', verify);

module.exports = exports = router;

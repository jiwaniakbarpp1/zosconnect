/**
* For local test:
*
* curl -X POST -H 'Content-Type: application/json' http://localhost:3000/catalogmanagertest/v1/apps/bca45894-92f7-49dc-ae54-b23b89ab6c73/sendConfirmation -d '{"email":"zmobileicc@gmail.com","addressBlocks":"{\"AddressBlock1\":\"12 RUE\", \"AddressBlock2\":\"MONTPELLIER\",\"AddressBlock3\":\"FRANCE\"}", "order":"{\"itemID\":10,\"description\":\"test sample\",\"nb\":10}"}'
*/


// Modules
var router = require('express').Router();
var apiUser = "";
var apiKey = "";

if (process.env.VCAP_SERVICES) {
    var services = JSON.parse(process.env.VCAP_SERVICES);
    for (var svcName in services) {
        if (svcName.match(/^sendgrid/)) {
            var sendGridCredentials = services[svcName][0]['credentials'];
            apiUser = sendGridCredentials.username;
            apiKey = sendGridCredentials.password;
            break;
        }
    }
} else {
    apiUser = "qpYs5lZPB0";
    apiKey = "Jrsf3Rg2jiZ36265";
}
var sendgrid = require("sendgrid")(apiUser, apiKey);

function send(req, res){
//    console.log(req);
    var email = req.body.email;
    var addressBlocks = JSON.parse(req.body.addressBlocks);
    var order = JSON.parse(req.body.order);

    if (!email){
        res.send('Error: missing email information');
	return;
    }
    var msg = "<div>Hi dear customer, <br/><br/>";
    msg += "Your order of " + order.nb + " " + order.ca_sngl_description + " (item ref. " + order.itemID + ") is confirmed. Your shipping address is " + addressBlocks.user + " " + addressBlocks.AddressBlock1 + " " + addressBlocks.AddressBlock2 + " " + addressBlocks.AddressBlock3 + ".<br/><br/>";
    msg += "*** This is an automatically generated email, please do not respond to this email address ***<br/><br/>";
    msg += "Best regards,<br/><br/> zMobile co."; 
  
// using SendGrid's Node.js Library - https://github.com/sendgrid/sendgrid-nodejs
var email = new sendgrid.Email({
  to: email,
  from: 'zmobileicc@gmail.com',
  subject: 'Order confirmation',
  html: msg
});

sendgrid.send(email,
    function(err, json) {
        if (err) { 
            res.send(err);
        } else {
            res.send(json);
        }
    });
}

router.post('/sendConfirmation', send);

module.exports = exports = router;

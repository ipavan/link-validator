var express = require('express');
var bodyParser = require('body-parser');
const request = require('request-promise');
var parseString = require('xml2js').parseString;
var app = express();
var port = process.env.PORT || 8080;

// Serve static files
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

// Serve your app
console.log('Served: http://localhost:' + port);
app.listen(port);

global.marketingCloudAccessToken = {
	access_token: "",
	expiry: null,
	isExpired: true
}

function getAccessToken() {
	return new Promise((resolve, reject) => {
		if (global.marketingCloudAccessToken.expiry) {
			console.log('Ive gotten a token before');
			let timediff = global.marketingCloudAccessToken.expiry - process.hrtime()[0];
			if (timediff > 20) {
				console.log('my token is still active');
				global.marketingCloudAccessToken.isExpired = false;
			} else {
				console.log('my token is expired');
				global.marketingCloudAccessToken.isExpired = true;
			}
		}
		if (global.marketingCloudAccessToken.isExpired == true) {
			console.log('getting new token');
			var options = {
	            method: 'POST',
	            uri: `https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.auth.marketingcloudapis.com/v2/token`,
	            body: {
	              'grant_type': 'client_credentials',
	              'client_id': `0yx4e8t1xqsegm9ur7heq9tm`,
	              'client_secret': `Q4QiUd1WxFAPlwR2LGzxXnKK`,
	              'account_id':'500009370'
	            },
	            json: true
	        }
			request(options, (err, res) => {
				if (err) reject(err);
				else {
					global.marketingCloudAccessToken.access_token = res['body']['access_token'];
					global.marketingCloudAccessToken.expiry = res['body']['expires_in'] ? process.hrtime()[0] + res['body']['expires_in'] : null;
					global.marketingCloudAccessToken.isExpired = false;
					console.log(global.marketingCloudAccessToken.access_token);
					resolve(global.marketingCloudAccessToken.access_token);
				};
			})
		}
		else {
			resolve(global.marketingCloudAccessToken.access_token);
		}
	})
}

function getEmails() {
	return new Promise((resolve, reject) => {
		var options = {
            method: 'POST',
            uri: `https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.rest.marketingcloudapis.com/asset/v1/content/assets/query`,
            headers: {
			    'Content-Type': 'application/json',
			    'Authorization': `Bearer ${global.marketingCloudAccessToken.access_token}`
			},
            body: {
              'page': {
              	'page':1,
              	'pageSize':50
              },
              'query':{
              	'leftOperand': {
              		'property':'assetType.name',
              		'simpleOperator': 'equal',
              		'value': 'templatebasedemail'
              	},
              	'logicalOperator': 'OR',
              	'rightOperand': {
              		'property': 'assetType.name',
              		'simpleOperator':'equal',
              		'value':'htmlemail'
              	}
              }
            },
            json: true
        }
        request(options, (err, res) => {
        	if (err) reject(err);
        	resolve(res);
        });
	})
}

app.get('/getEmails', (req, res) => {
	getAccessToken().then((data) => {
		getEmails().then((result) => {
			res.send(result);
		});
	});
});

app.get('/getDEs', (req, res) => {
	getAccessToken()
	.then((data) => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">    <s:Header>        <a:Action s:mustUnderstand="1">Retrieve</a:Action>        <a:To s:mustUnderstand="1">https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.soap.marketingcloudapis.com/Service.asmx</a:To>        <fueloauth xmlns="http://exacttarget.com">${global.marketingCloudAccessToken.access_token}</fueloauth>    </s:Header>    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">      <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">         <RetrieveRequest>            <ObjectType>DataExtension</ObjectType>            <Properties>ObjectID</Properties>            <Properties>CustomerKey</Properties>       <Properties>SendableDataExtensionField.Name</Properties>  <Properties>SendableSubscriberField.Name</Properties>   <Properties>Name</Properties>            <Filter xsi:type="SimpleFilterPart">                    <Property>IsSendable</Property>                    <SimpleOperator>equals</SimpleOperator>                    <Value>True</Value>            </Filter>         </RetrieveRequest>      </RetrieveRequestMsg>    </s:Body></s:Envelope>`;
		var options = {
		    method: 'POST',
		    uri: `https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.soap.marketingcloudapis.com/Service.asmx`,
		    headers: {
		        'Content-Type': 'text/xml'
		    },
		    body: xml,
		    json: false 
		};
		request(options, (err, response) => {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				parseString(response['body'], function (err, result) {
					let envelope = result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0];
					res.send(envelope);
				});
			}
		});
	});
});

app.post('/getSubs', (req, res) => {
	let deKey = req.body.deKey;
	let sendableField = req.body.sendableKey;
	getAccessToken()
	.then((data) => {
		let xml = `<?xml version="1.0" encoding="UTF-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">    <s:Header>        <a:Action s:mustUnderstand="1">Retrieve</a:Action>        <a:To s:mustUnderstand="1">https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.soap.marketingcloudapis.com/Service.asmx</a:To>        <fueloauth xmlns="http://exacttarget.com">${global.marketingCloudAccessToken.access_token}</fueloauth>    </s:Header>    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">            <RetrieveRequest>                        <ObjectType>DataExtensionObject[${deKey}]</ObjectType>                        <Properties>${sendableField}</Properties>                     </RetrieveRequest>        </RetrieveRequestMsg>    </s:Body></s:Envelope>`;
		var options = {
		    method: 'POST',
		    uri: `https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.soap.marketingcloudapis.com/Service.asmx`,
		    headers: {
		        'Content-Type': 'text/xml'
		    },
		    body: xml,
		    json: false 
		};
		request(options, (err, response) => {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				parseString(response['body'], function(err, result) {
					let envelope = result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0];
					res.send(envelope);
				})
			}
		});
	});
});

app.post('/getSubscriberPreview', (req, res) => {
	let row = req.body.row;
	let emailId = req.body.emailId;
	let deId = req.body.deId;
	getAccessToken()
	.then((data) => {
		var options = {
            method: 'POST',
            uri: `https://mcmn2cc-hkrhh8yfwb0v0mz8y2q4.rest.marketingcloudapis.com/guide/v1/emails/${emailId}/dataExtension/${deId}/contacts/key:${row}/preview`,
            headers: {
			    'Content-Type': 'application/json',
			    'Authorization': `Bearer ${global.marketingCloudAccessToken.access_token}`
			},
            json: true
        }

        console.log(options.uri);

        request(options, (err, result) => {
        	if (err) reject(err);
        	res.send(result);
        });
	});
});

app.post('/checkValidity', (req, res) => {
	let count = req.body.count;
	let url = req.body.url;
	var options = {
		method: 'HEAD',
		uri: url
	};

	request(options)
	.then(function(result) {
		res.send({count: count, value: 'True'});
	})
	.catch(function(err) {
		console.log("There was an error");
		res.send({count: count, value: 'False'});
	})
});
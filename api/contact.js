'use strict';
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
const url = require('url');
const https = require('https');
//config
//IN PRACTICE YOU DON'T WANT TO STORE ANY API KEYS/ SLACK HOOKS IN CONFIG
//USE AMAZON KMS - https://aws.amazon.com/kms/
var config = require('config-json');
switch (process.env.MODE) {
    case "prod":
        config.load('./conf/dev.conf.json');
        break;
    case "test":
        config.load('./conf/dev.conf.json');
        break;
    case "dev":
        config.load('./conf/dev.conf.json');
        break;
    default:
        config.load('./conf/dev.conf.json');
}

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails) 
const auth = {
    auth: {
        api_key: config.get("email", "auth_key"),
        domain: config.get("email", "domain")
    }
}
const slackHook=config.get("slack", "url");
const slackChannel=config.get("slack", "channel");

module.exports.contactMe = (event, context, callback) => {
console.log(event.body);
    sendMail(
        event,
        function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, setResponse(data));
            }
        }
    );

};

/**
 * Send email to someone using mailgun
 * 
 * @param event [
 *  to,
 *  name,
 *  phone,
 *  message
 * ]
 */
function sendMail(event, callback) {
    var toEmail = config.get("email", "to");
    var transporter = nodemailer.createTransport(mg(auth));

    var message = getRequest(event).body;
    var isSlack = message.slack;
    if (message.to !== null) {
        toEmail = message.to;
    }
    message.message = "\
  A contact from the website\
  Name: "+ message.name + " \
  Email: "+ message.email + " \
  Phone: "+ message.phone + " \
  Message: "+ message.message + " \
  ";
    var mailOptions = {
        from: message.name + "<" + message.email + ">",
        to: toEmail, // An array if you have multiple recipients. 
        subject: 'Contact from website',
        'h:Reply-To': 'reply2this@company.com',
        //You can use "text:" to send plain-text content. It's oldschool! 
        text: message.message
    };

    /**
     * Sends mail via mailgun plugin/node-mailer
     */
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            callback(error, null);
        } else {
            console.log(JSON.stringify(info));
            //now do a callback to send Slack Message
            if(isSlack){
                
            }else{
                callback(null, info);
            }

            
        }
    });

}

/**
 * Sends a slack message.
 * 
 * @param array event 
 * @param function callback 
 */
function sendSlackMessage(event, callback){

}

/*
Helper functions for API Gateway response and request handling through to Lambda.
(typically in a helper shared library)
 */
function setResponse(data) {

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Some-Random-Header": "OKDOKE"
            // "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(data)
    };

}

/*
returns a request event object that has been parsed from JSON.parse
(typically in a helper shared library)
*/
function getRequest(event) {

    return {
        headers: event.headers,
        body: JSON.parse(event.body)
    };
}




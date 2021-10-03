// Initialize Alexa.
var alexa = require('alexa-app');
var app = new alexa.app();

// Other libraries.
const honeydewVoice = require('honeydew-voice');
const winston = require('winston');
const warmer = require('lambda-warmer');

// Initialize logger.
let log_level = 'info';
if (process.env.NODE_ENV !== 'production') {
  log_level = 'debug';
}
const logger = winston.createLogger({
  level: log_level,
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
});

// Handle launch event.
app.launch(function (request, response) {
  getHelp(response);
});

// Handle help event.
app.intent('AMAZON.HelpIntent', function (request, response) {
  getHelp(response);
});

app.intent('AMAZON.StopIntent', function (request, response) {
  killSession(response);
});

app.intent('AMAZON.CancelIntent', function (request, response) {
  killSession(response);
});

function killSession(response) {
  response.say('Goodbye.');
}

function getHelp(response) {
  var output = 'Honeydew lets you add items to your grocery list. Try adding an item now.';
  var reprompt = 'For instance, ask Honeydew to add milk.';
  response.say(output).shouldEndSession(false, reprompt);
}

// Handle add item intent.
app.intent('AddItemIntent', async (request, response) => {
  var itemName = request.slot('Item');
  var sessionToken = request.getSession().details.user.accessToken;

  try {
    await honeydewVoice.addItem(itemName, sessionToken);
  }
  catch (error) {
    switch (error) {
      case 'Missing item name':
        return response.say('Sorry, I did not hear an item name.').send();
      case 'Invalid session token':
        return response.say('Please use the Alexa app to link your account').linkAccount.send();
      case 'invalid session token':
        return response.say('Your session token is invalid. Please use the Alexa app to unlink and re-link your account.').send();
      case 'No active subscription':
        return response.say('You do not have an active subscription. Please use the Android app to renew your subscription.').send();
      default:
        response.say('Sorry, due to a technical problem I was not able to add this item.');
    }
  }
  var message = 'Okay, I added ' + itemName + ' to your grocery list.';
  return response.say(message).send();
});

exports.handler = function(event, context, callback) {
  warmer(event).then(isWarmer => {
    if (isWarmer) {
      callback(null,'warmed');
    } else {
      // Alexa Request
      logger.info('Alexa request received.');
      app.handler(event, context, callback);
    }
  });
};

// TODO: Consider integration intent schema etc according to alexa app docs.

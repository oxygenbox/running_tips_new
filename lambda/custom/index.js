/* eslint-disable  func-names */
/* eslint-disable  no-console */


//TODO
// Improve follow question maybe run out then prompt
//after third next then offer multiple hints
//First visit and every third visit offer multiple tips if it wa not already
//play number of tips
//seque between tips
//play lead out
//Hey, Before I get back to my run did you know that you can ask me to give you between 1 and 4 tips each time you vist?
//add separate launchrequest

/*




*/




const Alexa = require('ask-sdk');


const curl = "https://api.airtable.com/v0/appGz6ZUnAcuRqZqL/Quotes%201?maxRecords=3&view=Grid%20view"
const api = `key3U134dikagDttl`

//AirsTable Code
var Airtable = require('airtable');
var base = new Airtable({apiKey: 'key3U134dikagDttl'}).base('appGz6ZUnAcuRqZqL');


const data = require('./data/data');
const runningSound = "<audio src='https://s3.amazonaws.com/ask-soundlibrary/human/amzn_sfx_person_running_01.mp3'/>";
const followUpLimit = 3;
const tipLimit = 3;


// Called when LaunchWithRepromptRequestHandler is not
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.visits += 1

    //reset flag to not having been set
    if(sessionAttributes.tipsPerVisit < 1){
      sessionAttributes.tipsPerVisit = 0;
    }

   const tipMessage =  buildTipMessage.call(this, sessionAttributes);
   const speechText = `Launch request handler, ${sessionAttributes.visits} ${tipMessage} `;

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Running Tips', speechText)
      .getResponse();
  },
};

//Launch request with reprompt
const LaunchWithRepromptRequestHandler = {
  canHandle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    //tipsPerVisit has been increased
    var promptCheck = sessionAttributes.tipsPerVisit < 1 && (sessionAttributes.visits % tipLimit === 0);
    if(sessionAttributes.visits === 0){
      promptCheck = true;
    }
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
    && promptCheck;
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.visits += 1
    
    //reset flag to not having been set
    if(sessionAttributes.tipsPerVisit < 1){
      sessionAttributes.tipsPerVisit = 0;
    }

    Airtable.configure({ apiKey: 'key3U134dikagDttl' })

    //----------------------
    let retrieved = base('Quotes').select({
      view: 'Grid view'
  }).firstPage(function(err, records) {
      if (err) { console.error(err); return; }
      records.forEach(function(record) {
          console.log('Retrieved', record.get('Quote'));
      });
  });

   const table = base('Quote')

  var tableArray = table.select({
    view: 'Grid view'
    }).firstPage((err, records) => {
    if (err) {
      console.error(err)
      return
    }

    //all records are in the `records` array, do something with it
})




  console.log(retrieved);
  //--------------------


    

   const tipMessage =  buildTipMessage.call(this, sessionAttributes);
   const repromptText = getRepromptMessage.call(this, sessionAttributes);
   const delay = "<break time='2s' />";
  
    const speechText = `Launch with repromp called Air table ${tipMessage} ${delay} ${repromptText}`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const MultipleTipIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MultipleTipIntent';
  },
  handle(handlerInput) {

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
    const qty = handlerInput.requestEnvelope.request.intent.slots.quantity.value;

    var speechOutput = `multi-tip called`;
    var repromptText = ` reprompt`
    
    if(qty < 1 || qty > tipLimit) {
      //out of range
      speechOutput = `you can set the number of tips to between 1 and ${tipLimit} per visit`;
      repromptText = ` How many tips would you like to hear per visit?`;
    } else {
      //set the value
      sessionAttributes.tipsPerVisit = qty;
      var tipInfo = `a tip`
      if(qty > 1) {
        tipInfo = `${qty} tips`
      }

      speechOutput = ` Great! I will give you ${tipInfo} everytime you visit. `;
      repromptText = `Would you like to hear more tips now?`;
    }

      speechOutput = `${speechOutput}, ${repromptText}`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptText)
      .withSimpleCard('Hello World', speechOutput)
      .getResponse();
  },
};






const AnotherTipIntentIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AnotherTipIntent';
  },
  handle(handlerInput) {

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
    const speechText = buildTipMessage.call(this, sessionAttributes);
    const repromptText = `Would you like another? `;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};


const YesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes()
    const speechText = buildTipMessage.call(this, sessionAttributes);
    const repromptText = `Would you like another? `;
    

    return handlerInput.responseBuilder
      .speak(`${speechText} ${repromptText}`)
      .reprompt(repromptText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};


const NoIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const index = getFollowUpIndex.call(this, sessionAttributes);

    const message = data.followUp[index]
    const delay = "<break time='3s' />";
    
   const speechOutput = `${message} ${runningSound}`;
    
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard('Hello World', speechOutput)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

//-----------
//INTERCEPTORS
const RequestPersistenceInterceptor = {
   
  async process(handlerInput){
    
    if(handlerInput.requestEnvelope.request.type === 'LaunchRequest'){
      //first visit grab data from db
      let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
      handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
    }
    
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    if(Object.keys(sessionAttributes).length ===0) {
      resetDB.call(this,sessionAttributes);
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }
  } 
}

const ResponsePersistantInterceptor = {
  async process(handlerInput){
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    handlerInput.attributesManager.setPersistentAttributes(sessionAttributes);
    await handlerInput.attributesManager.savePersistentAttributes();
  }
};






const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchWithRepromptRequestHandler,
    LaunchRequestHandler,
    MultipleTipIntentHandler,
    AnotherTipIntentIntentHandler,
    YesIntentHandler,
    NoIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withAutoCreateTable(true)
  .withTableName("running_tips_new")
  .addRequestInterceptors(
    RequestPersistenceInterceptor
  )
  .addResponseInterceptors(
    ResponsePersistantInterceptor
  )
  .lambda()

//---------------
// Helper functions
function resetDB(attributes) {
  attributes.visits = 0;
  attributes.tipsPerVisit = 0; //Zero means it was never set or asked
  attributes.indexArray = [];
  attributes.leadIndexArray = [];
  attributes.followIndexArray = [];

}

function newIndexArray() {
  let newArray = [];
  for (var i = 0; i < data.tips.length; i++) {
   newArray.push(i);
  }
 
  return newArray;
 }
 
 function createIndexArray(total) {
  let newArray = [];
  for (var i = 0; i < total; i++) {
   newArray.push(i);
  }
 
  return newArray;
 }
 
function getNextTip(attributes) {
  if(attributes.indexArray.length < 1){
    //create a new array
    attributes.indexArray = mixupArray(data.tips.length);
  }

  return attributes.indexArray.shift();

}

function getLeadInIndex(attributes) {
  if(attributes.leadIndexArray.length < 1){
    //create a new array
    attributes.leadIndexArray = mixupArray(data.leadIn.length);
  }

  return attributes.leadIndexArray.shift();

}

function getFollowUpIndex(attributes) {
  if(attributes.followIndexArray.length < 1){
    //create a new array
    attributes.followIndexArray = mixupArray(data.followUp.length);
  }

  return attributes.followIndexArray.shift();
}

function mixupArray(num) {
  
  var sourceArray = [];
  var newArray = [];
  
  //create an array with numberm zero tp num
  for (var i = 0; i < num; i++) {
    sourceArray.push(i);
  }
  
  //pull out random number  fromm sourve to build new array
  while (sourceArray.length > 0) {
   let index = Math.floor(Math.random() * sourceArray.length);
   let value = sourceArray[index];
   sourceArray.splice(index, 1);
   newArray.push(value);
  }
 
  return newArray;
};

//-----------
function getTipAtIndex(num) {
  return data.tips[num]
}


function buildTipMessage(attributes) {
  //const lead = data.leadIn[0];
  const leadIndex = getLeadInIndex.call(this, attributes);
  const lead = data.leadIn[leadIndex];
  const tipIndex = getNextTip.call(this, attributes);
  const tip = getTipAtIndex.call(this, tipIndex);
  const delay = "<break time='5ms' />";

  //only play running sound if the tip has no other sfx
  if (!tip.includes('<audio src=')) {
    return `${runningSound} ${lead} ${delay} ${tip}`;
   } else {
    return `${lead} ${delay} ${tip}`;
   }

}

function getRepromptMessage(attributes){
  if(attributes.visits < 1){
    return `fist visit reprompt`
  } else {
    return `this is visit ${attributes.visits}`
  }
}

function getReprompt(attributes){

  const visits = attributes.visits
  //TODO make a list of reprompt
  var message = `if you'd like, you can ask for another tip.`;
  //TODO Only ask once per visit
  if(attributes.tipsPerVisit === 0 && (visits === 0 || visits % 3 === 0) ) {
    message += ` Or, if you prefer, you can ask me to automatically give you up to four tips per visit.`
    //act as a flag prevent from prompting this message mor than one per visit
    //reset on launch
    attributes.tipsPerVisit = -1;
  } 

  return message;


}

/*
function sayAs(phrase) {
  const voiceName = `Kendra`
    return `<voice name=${voiceName}>${phrase}</voice>.`;
}
*/

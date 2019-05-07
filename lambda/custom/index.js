/* eslint-disable  func-names */
/* eslint-disable  no-console */


//TODO
// IMprove follow question maybe run out then prompt
//after third next then offer multiple hints

const Alexa = require('ask-sdk');

const data = require('./data/data');
const runningSound = "<audio src='https://s3.amazonaws.com/ask-soundlibrary/human/amzn_sfx_person_running_01.mp3'/>";
const followUpLimit = 3;

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
   const repromptText = getReprompt.call(this, sessionAttributes);
   const delay = "<break time='2s' />";
  
    const speechText = `${tipMessage} ${delay} ${repromptText}`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Hello World', speechText)
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
    LaunchRequestHandler,
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
  const delay = "<break time='0.7s' />";

  return `${runningSound} ${lead} ${delay} ${tip}`;
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


//----------
function getNextItem(array) {
  let val = array.shift()
  array.push(val);
  return val;
}


function sayAs(phrase) {
  const voiceName = `Kendra`
    return `<voice name=${voiceName}>${phrase}</voice>.`;
}

*/

  /*
//


var handlers = {
 'LaunchRequest': function() {

  //create index array
  if (this.attributes['indexArray']) {}
  else {
   this.attributes['indexArray'] = newIndexArray();
  }

  //create lead in array
  if (this.attributes['leadIn']) {}
  else {
   this.attributes['leadIn'] = createIndexArray(data.leadIn.length);
  }

  //create follow up tracker to monitor followUp
  if (!this.attributes['followUpTracker']) {
   this.attributes['followUpTracker'] = [];
  }


  this.emit('PlayRandomTip');
 },

 'PlayRandomTip': function() {
  
   //create index array
  if (this.attributes['indexArray']) {}
  else {
   this.attributes['indexArray'] = newIndexArray();
  }

  //create lead in array
  if (this.attributes['leadIn']) {}
  else {
   this.attributes['leadIn'] = createIndexArray(data.leadIn.length);
  }

  //create follow up tracker to monitor followUp
  if (!this.attributes['followUpTracker']) {
   this.attributes['followUpTracker'] = [];
  }
  
  
  //GET A TIP
  if (this.attributes['indexArray'].length < 1) {
   this.attributes['indexArray'] = newIndexArray();
  }

  //grab a random postion
  var index = Math.floor(Math.random() * this.attributes['indexArray'].length);
  //grab index at that position
  var tipIndex = this.attributes['indexArray'][index];
  //delete the index from the array
  this.attributes['indexArray'].splice(index, 1);
  var tip = data.tips[tipIndex];

  var speechOutput = "";
  var leadIn = "";
  var followUp = "";

  

  //GET A LEAD-IN
  if (this.attributes['leadIn'].length < 1) {
    this.attributes['leadIn'] = createIndexArray(data.leadIn.length);
   }
   index = Math.floor(Math.random() * this.attributes['leadIn'].length);
   var leadInIndex = this.attributes['leadIn'][index];
   this.attributes['leadIn'].splice(index, 1);
   leadIn = data.leadIn[leadInIndex];
 
   //GET A FOLLOW UP 
   if (this.attributes['followUpTracker'].length < followUpLimit) {
    //hasnt hit limit
    this.attributes['followUpTracker'].push(1);
   }
   else {
    //limit reached play followup
    //reset tracker
    this.attributes['followUpTracker'] = [];
 
    //make sure array is populated
    if (this.attributes['followUp'].length < 1) {
     this.attributes['followUp'] = createIndexArray(data.followUp.length);
    }
 
    index = Math.floor(Math.random() * this.attributes['followUp'].length);
    var followUpIndex = this.attributes['followUp'][index];
    this.attributes['followUp'].splice(index, 1);
    followUp += "<break time='3s' />";
    followUp += data.followUp[followUpIndex];
    followUp += runningSound;
 
   }
 
   this.attributes['lastTip'] = tip;
 
   if (!tip.includes('<audio src=') && followUp === "") {
    speechOutput = runningSound;
   }
 
   speechOutput += leadIn;
   speechOutput += "<break time='0.7s' />";
   speechOutput += tip;
   speechOutput += followUp;
   this.emit(':tell', speechOutput);
 
  },
  
  'GetNewFactIntent': function() {
  
   this.emit('PlayRandomTip');
  },
 
 
 
 
 
 
 };
 

  */



  /*
  //-----------------------------------

{
    "interactionModel": {
        "languageModel": {
            "invocationName": "running tips",
            "intents": [
               
                {
                    "name": "AMAZON.HelpIntent",
                    "samples": []
                },
                
                {
                    "name": "GetNewFactIntent",
                    "slots": [],
                    "samples": [
                        "Give me a tip",
                        "Tell me a tip",
                        "Give me a fact",
                        "Tell me something interesting",
                        "What have you got",
                        "Give me a running tip",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "What's the tip",
                        ""
                    ]
                },
                {
                    "name": "AMAZON.NavigateHomeIntent",
                    "samples": []
                }
            ],
            "types": []
        }
    }
}
  */




  /*




const shortBreak = `<break time="0.25s"/>`;
const midBreak = `<break time="0.5s"/>`;
const longBreak = `<break time="1s"/>`;

//HANDLERS







  //HELPER FUNCTIONS

  

  function resetGame(attributes){
    attributes.state = `play`;
    attributes.score = 0;
  }

   




  */
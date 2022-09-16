const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const ParameterValidator = require(Runtime.getFunctions()['common/helpers/parameter-validator'].path);
const ConferenceFailoverOperations = require(Runtime.getFunctions()['external-transfer/utils/conference-failover'].path);

exports.handler = TokenValidator(async (context, event, callback) => {

  const scriptName = arguments.callee.name;
  const response = new Twilio.Response();
  const requiredParameters = [
      { key: 'taskSid', purpose: 'unique ID of task to update' },
      { key: 'participantSid', purpose: 'unique ID of participant to announce failure to' },
      { key: 'to', purpose: 'number to add to the conference' },
      { key: 'from', purpose: 'caller ID to use when adding to the conference' },
      { key: 'sipTarget', purpose: 'SIP target array to use for forming SIP address' },
  ];
  const parameterError = ParameterValidator.validate(context.PATH, event, requiredParameters);

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (parameterError) {
      console.error(`${scriptName} invalid parameters passed`);
      response.setStatusCode(400);
      response.setBody({ data: null, message: parameterError });
      callback(null, response);
      return;
  }

  try {
    const {
        taskSid,
        participantSid,
        to,
        from,
        sipTarget
    } = event;
    
    const assetPath = '/sip-targets.json';
    
    // load sip targets
    const openSipTargets = Runtime.getAssets()[assetPath].open;
    const sipTargets = JSON.parse(openSipTargets())[sipTarget];
    
    const failoverAttempt = 0;
    const toSip = `sip:${to}@${sipTargets[failoverAttempt].address};tnx=${sipTargets[failoverAttempt].tnxSid}`;
    
    console.log(`Adding SIP address to conference: ${toSip}`);
    
    const result = await ConferenceFailoverOperations.addParticipantSip(
      {
        context,
        scriptName,
        taskSid,
        participantSid,
        to: toSip,
        from,
        sipTarget,
        failoverAttempt,
        attempts: 0
      });

    const { success, participantsResponse, status } = result;

    response.setStatusCode(status);
    response.setBody({ success, participantsResponse });
    callback(null, response);

  } catch (error) {

    console.error(`Unexpected error occurred in ${scriptName}: ${error}`);
    response.setStatusCode(500);
    response.setBody(
      { 
        success: false, 
        message: error 
      });
    callback(null, response);
  }
});

const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const ParameterValidator = require(Runtime.getFunctions()['common/helpers/parameter-validator'].path);
const VoiceFailoverOperations = require(Runtime.getFunctions()['external-transfer/utils/cold-transfer-failover'].path);

exports.handler = TokenValidator(async (context, event, callback) => {

  const scriptName = arguments.callee.name;
  const response = new Twilio.Response();
  const requiredParameters = [
      { key: 'callSid', purpose: 'unique ID of call to update' },
      { key: 'to', purpose: 'phone number to transfer to' },
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
        callSid,
        to,
        sipTarget
    } = event;
    
    const assetPath = '/sip-targets.json';
    
    // load sip targets
    const openSipTargets = Runtime.getAssets()[assetPath].open;
    const sipTargets = JSON.parse(openSipTargets())[sipTarget];
    
    const failoverAttempt = 0;
    const toSip = `sip:${to}@${sipTargets[failoverAttempt].address};tnx=${sipTargets[failoverAttempt].tnxSid}`;
    
    console.log(`Setting SIP address for cold transfer attempt ${failoverAttempt}: ${toSip}`);
    
    const result = await VoiceFailoverOperations.coldTransferSip(
      {
        context,
        scriptName,
        callSid,
        to,
        toSip,
        sipTarget,
        failoverAttempt,
        attempts: 0
      });

    const { success, status } = result;

    response.setStatusCode(status);
    response.setBody({ success });
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

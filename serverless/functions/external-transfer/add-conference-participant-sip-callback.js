const ConferenceFailoverOperations = require(Runtime.getFunctions()['external-transfer/utils/conference-failover'].path);

exports.handler = async (context, event, callback) => {

  const scriptName = arguments.callee.name;
  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const {
        taskSid,
        participantSid,
        failoverAttempt,
        sipTarget,
        To,
        From,
        CallStatus
    } = event;
    
    if (CallStatus !== "failed" && CallStatus !== "busy") {
      callback(null);
      return;
    }
    
    const assetPath = '/sip-targets.json';
    
    // load sip targets
    const openSipTargets = Runtime.getAssets()[assetPath].open;
    const sipTargets = JSON.parse(openSipTargets())[sipTarget];
    
    let result;
    
    if (Number(failoverAttempt) >= sipTargets.length) {
      console.log(`Exhausted all SIP failover targets; last attempted: ${To}`);
      
      result = await ConferenceFailoverOperations.announceFailure(
        {
          context,
          scriptName,
          taskSid,
          participantSid,
          attempts: 0
        });
    } else {
      const toSip = `sip:${To.match(/^(sips?):([^@]+)(?:@(.+))?$/)[2]}@${sipTargets[failoverAttempt].address};tnx=${sipTargets[failoverAttempt].tnxSid}`;
      
      console.log(`Handling SIP failover attempt ${failoverAttempt} to: ${toSip}`);
    
      result = await ConferenceFailoverOperations.addParticipantSip(
        {
          context,
          scriptName,
          taskSid,
          participantSid,
          to: toSip,
          from: From,
          sipTarget,
          failoverAttempt: Number(failoverAttempt),
          attempts: 0
        });
    }

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
};

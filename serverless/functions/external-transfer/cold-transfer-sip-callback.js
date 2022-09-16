const ParameterValidator = require(Runtime.getFunctions()['common/helpers/parameter-validator'].path);

exports.handler = async (context, event, callback) => {
  try {
    const {
      DialCallStatus,
      sipUser,
      sipTarget,
      failoverAttempt
    } = event;
    
    if (DialCallStatus !== "failed" && DialCallStatus !== "busy") {
      callback(null);
      return;
    }
    
    const assetPath = '/sip-targets.json';
    
    // load sip targets
    const openSipTargets = Runtime.getAssets()[assetPath].open;
    const sipTargets = JSON.parse(openSipTargets())[sipTarget];
    
    if (Number(failoverAttempt) >= sipTargets.length) {
      // we've exhausted all attempts
      const twiml = new Twilio.twiml.VoiceResponse();
      twiml.say('Sorry, an error occurred with the transfer. Please try your call again. Goodbye.');
      
      callback(null, twiml);
      return;
    }
    
    const toSip = `sip:${sipUser}@${sipTargets[failoverAttempt].address};tnx=${sipTargets[failoverAttempt].tnxSid}`;
    
    console.log(`Setting SIP address for cold transfer attempt ${failoverAttempt}: ${toSip}`);
    
    const twiml = new Twilio.twiml.VoiceResponse();
    const dial = twiml.dial({
      action: `https://${process.env.DOMAIN_NAME}/external-transfer/cold-transfer-sip-callback?failoverAttempt=${Number(failoverAttempt) + 1}&amp;sipTarget=${sipTarget}&amp;sipUser=${sipUser}`,
      method: 'GET'
    });
    dial.sip(toSip);

    callback(null, twiml);

  } catch (error) {
    const scriptName = arguments.callee.name;
    
    console.error(`Unexpected error occurred in ${scriptName}: ${error}`);
    
    const twiml = new Twilio.twiml.VoiceResponse();
    twiml.say('Sorry, an error occurred with the transfer. Please try your call again. Goodbye.');
    
    callback(null, twiml);
  }
};
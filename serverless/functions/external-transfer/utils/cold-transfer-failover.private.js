const { isString, isObject, isNumber } = require("lodash");

const retryHandler = (require(Runtime.getFunctions()['common/twilio-wrappers/retry-handler'].path)).retryHandler;


/**
 * @param {object} parameters the parameters for the function
 * @param {string} parameters.scriptName the name of the top level lambda function 
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.callSid the unique call SID to fetch
 * @param {string} parameters.to the phone number to transfer to
 * @param {string} parameters.toSip the full SIP address to transfer to
 * @param {string} parameters.from the phone number for caller ID
 * @param {string} parameters.sipTarget SIP target array to use for forming SIP address
 * @param {string} parameters.failoverAttempt how many times we've failed over
 * @returns {object} generic response object
 * @description cold transfers the given call SID to the given phone number
 */
exports.coldTransferSip = async (parameters) => {
    
    const { context, callSid, to, toSip, from, sipTarget, failoverAttempt } = parameters;

    if(!isObject(context))
        throw "Invalid parameters object passed. Parameters must contain reason context object";
    if(!isString(callSid))
        throw "Invalid parameters object passed. Parameters must contain callSid string";
    if(!isString(to))
        throw "Invalid parameters object passed. Parameters must contain to string";
    if(!isString(toSip))
        throw "Invalid parameters object passed. Parameters must contain toSip string";
    if(!isString(from))
        throw "Invalid parameters object passed. Parameters must contain from string";
    if(!isString(sipTarget))
        throw "Invalid parameters object passed. Parameters must contain sipTarget string";
    if(!isNumber(failoverAttempt))
        throw "Invalid parameters object passed. Parameters must contain failoverAttempt number";

    try {
        const client = context.getTwilioClient();
        
        const twiml = `<Response>
        <Dial action="https://${process.env.DOMAIN_NAME}/external-transfer/cold-transfer-sip-callback?failoverAttempt=${failoverAttempt + 1}&amp;sipTarget=${encodeURIComponent(sipTarget)}&amp;sipUser=${encodeURIComponent(to)}&amp;callerId=${encodeURIComponent(from)}" method="GET" callerId="${from}">
        <Sip>${toSip}</Sip>
        </Dial>
        </Response>`;
        
        await client
          .calls(callSid)
          .update({ twiml });

        return { success: true, status: 200 };
    }
    catch (error) {
        return retryHandler(
            error, 
            parameters,
            arguments.callee
        )
    }
}
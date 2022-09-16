const { isString, isObject, isNumber } = require("lodash");

const retryHandler = (require(Runtime.getFunctions()['common/twilio-wrappers/retry-handler'].path)).retryHandler;


/**
 * @param {object} parameters the parameters for the function
 * @param {string} parameters.scriptName the name of the top level lambda function 
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.taskSid the unique task SID to modify
 * @param {string} parameters.participantSid unique ID of participant to announce failure to
 * @param {string} parameters.to the phone number to add to the conference
 * @param {string} parameters.from the caller ID to use when calling the to number
 * @param {string} parameters.sipTarget SIP target array to use for forming SIP address
 * @param {string} parameters.failoverAttempt how many times we've failed over
 * @returns {Participant} The newly created conference participant
 * @description adds the specified phone number as a conference participant
 */
exports.addParticipantSip = async (parameters) => {
    
    const { context, taskSid, participantSid, to, from, sipTarget, failoverAttempt } = parameters;

    if(!isObject(context))
        throw "Invalid parameters object passed. Parameters must contain reason context object";
    if(!isString(taskSid))
        throw "Invalid parameters object passed. Parameters must contain taskSid string";
    if(!isString(participantSid))
        throw "Invalid parameters object passed. Parameters must contain participantSid string";
    if(!isString(to))
        throw "Invalid parameters object passed. Parameters must contain to string";
    if(!isString(from))
        throw "Invalid parameters object passed. Parameters must contain from string";
    if(!isString(sipTarget))
        throw "Invalid parameters object passed. Parameters must contain sipTarget string";
    if(!isNumber(failoverAttempt))
        throw "Invalid parameters object passed. Parameters must contain failoverAttempt number";

    try {
        const client = context.getTwilioClient();
        
        const participantsResponse = await client
            .conferences(taskSid)
            .participants
            .create({
                to,
                from,
                earlyMedia: false,
                endConferenceOnExit: false,
                statusCallbackEvent: ['initiated', 'answered', 'ringing', 'completed'],
                statusCallback: `https://${process.env.DOMAIN_NAME}/external-transfer/add-conference-participant-sip-callback?failoverAttempt=${failoverAttempt + 1}&taskSid=${taskSid}&sipTarget=${sipTarget}&participantSid=${participantSid}`,
                statusCallbackMethod: 'POST'
            });

        return { success: true, participantsResponse, status: 200 };
    }
    catch (error) {
        return retryHandler(
            error, 
            parameters,
            arguments.callee
        )
    }
}


/**
 * @param {object} parameters the parameters for the function
 * @param {string} parameters.scriptName the name of the top level lambda function 
 * @param {number} parameters.attempts the number of retry attempts performed
 * @param {object} parameters.context the context from calling lambda function
 * @param {string} parameters.taskSid the unique task SID to modify
 * @param {string} parameters.participantSid the unique participant SID to announce to
 * @returns {Participant} The newly created conference participant
 * @description announces a transfer failure to the agent
 */
exports.announceFailure = async (parameters) => {
    
    const { context, taskSid, participantSid } = parameters;

    if(!isObject(context))
        throw "Invalid parameters object passed. Parameters must contain reason context object";
    if(!isString(taskSid))
        throw "Invalid parameters object passed. Parameters must contain taskSid string";
    if(!isString(participantSid))
        throw "Invalid parameters object passed. Parameters must contain participantSid string";

    try {
        const client = context.getTwilioClient();
        
        const participantsResponse = await client
            .conferences(taskSid)
            .participants(participantSid)
            .update({ announceUrl: `https://${process.env.DOMAIN_NAME}/sip-failure.xml` });

        return { success: true, participantsResponse, status: 200 };
    }
    catch (error) {
        return retryHandler(
            error, 
            parameters,
            arguments.callee
        )
    }
}
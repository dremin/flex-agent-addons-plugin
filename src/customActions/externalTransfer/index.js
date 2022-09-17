import ConferenceService from '../../services/ConferenceService';

export const kickExternalTransferParticipant = (payload) => {
    const { task, targetSid } = payload;

    const conference = task.attributes.conference ? 
        task.attributes.conference.sid : 
        task.conference.conferenceSid;

    const participantSid = targetSid;

    console.log(`Removing participant ${participantSid} from conference`);
    return ConferenceService.removeParticipant(conference, participantSid);
}

export const doColdTransfer = async (payload) => {
    const { task, to, sipTarget } = payload;
    const callSid = task.attributes.call_sid;
    let { from } = payload;
    
    if (task && task.attributes && task.attributes.from && !task.attributes.from.startsWith('sip:') && !task.attributes.from.startsWith('client:')) {
        // use customer phone number if present, otherwise the fallback number from payload is used
        from = task.attributes.from;
    }
    
    try {
        if (sipTarget) {
            await ConferenceService.coldTransferSip(callSid, to, from, sipTarget);
        } else {
            await ConferenceService.coldTransfer(callSid, to, from);
        }
    }
    catch(error){
        console.error('Error while doing Cold Transfer:', error);
    }
}

export const doWarmTransfer = async (payload) => {
    const { task, to, from, sipTarget } = payload;
    const conference = task && (task.conference || {});
    const { conferenceSid } = conference;
    
    const mainConferenceSid = task.attributes.conference ? 
    task.attributes.conference.sid : conferenceSid;
    
    console.log(`Adding ${to} to conference`);
    
    let participantCallSid;
    
    try {
        if (sipTarget) {
            // get the participant SID so that we can play a failure message to them if necessary.
            
            let callSid;
            conference.participants.every(participant => {
                if (participant.isCurrentWorker) {
                    callSid = participant.callSid;
                    return false;
                }
                
                return true;
            })
            
            participantCallSid = await ConferenceService.addParticipantSip(mainConferenceSid, callSid, from, to, sipTarget);
        } else {
            participantCallSid = await ConferenceService.addParticipant(mainConferenceSid, from, to);
        }
        ConferenceService.addConnectingParticipant(mainConferenceSid, participantCallSid, 'unknown');
    }
    catch(error){
        console.error('Error adding conference participant:', error);
    }
}
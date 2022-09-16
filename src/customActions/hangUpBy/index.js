import { hangUpBy as HangUpByHelper } from '../../helpers';
import { TaskHelper } from "@twilio/flex-ui";
import { HangUpBy } from '../../enums';

export const beforeTransferTask = (payload) => {
  HangUpByHelper.setHangUpBy(payload.sid, payload.options.mode === "COLD" ? HangUpBy.ColdTransfer : HangUpBy.WarmTransfer);
}

export const beforeKickParticipant = (payload) => {
  if (payload.participantType === "customer") {
    HangUpByHelper.setHangUpBy(payload.sid,  HangUpBy.Agent);
  }
}

export const beforeHangupCall = (payload) => {
  const currentHangUpBy = HangUpByHelper.getHangUpBy()[payload.sid];
  
  const task = TaskHelper.getTaskByTaskSid(payload.sid);
  
  if (currentHangUpBy == HangUpBy.ExternalWarmTransfer) {
    if (!HangUpByHelper.hasExternalJoined(task)) {
      // No external participant here, so the xfer must've aborted.
      HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Agent);
    } else {
      // Temporary value that we use to discern between agent completing an external warm transfer
      // versus a customer hanging up on one being attempted.
      // We need this because with external transfers, at the time of wrapup, no participants are joined.
      HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.CompletedExternalWarmTransfer);
    }
    
    return;
  }
  
  if (currentHangUpBy == HangUpBy.WarmTransfer) {
    // Do nothing if there is another joined worker. If no other joined worker, the transfer didn't complete
    // Let's say AgentB hung up or didn't answer, but then we hang up--change it to Agent in this case.
    if (task.outgoingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
      return;
    }
  } else if (task.incomingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
    // If this is an incoming xfer and there is another worker in the "joined" state,
    // this worker is aborting the consult
    HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Consult);
    return;
  }
  
  HangUpByHelper.setHangUpBy(payload.sid, HangUpBy.Agent);
}

export const beforeCompleteTask = async (payload) => {
  const task = TaskHelper.getTaskByTaskSid(payload.sid);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[payload.sid];
  
  if (!currentHangUpBy) {
    currentHangUpBy = HangUpBy.Customer;
    HangUpByHelper.setHangUpBy(payload.sid, currentHangUpBy);
  }
  
  if (currentHangUpBy === HangUpBy.CompletedExternalWarmTransfer) {
    // We shouldn't get here, but added a safety net so this value doesn't get saved.
    currentHangUpBy = HangUpBy.ExternalWarmTransfer;
    HangUpByHelper.setHangUpBy(payload.sid, currentHangUpBy);
  }
  
  await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
}

export const CustomExternalTransferTask = async (payload) => {
  let newHangUpBy;
  let { task, mode, to } = payload;
  
  if (mode == 'COLD') {
    newHangUpBy = HangUpBy.ExternalColdTransfer;
  } else if (mode == 'WARM') {
    newHangUpBy = HangUpBy.ExternalWarmTransfer;
  }
  
  HangUpByHelper.setHangUpBy(task.sid, newHangUpBy);
  await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, newHangUpBy, to);
}
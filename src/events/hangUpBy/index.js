import { hangUpBy as HangUpByHelper } from '../../helpers';
import { HangUpBy } from '../../enums';

export const taskWrapup = async (task) => {
  console.log('taskWrapup', task);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if (currentHangUpBy !== HangUpBy.Consult && task.incomingTransferObject && HangUpByHelper.hasAnotherWorkerJoined(task)) {
    currentHangUpBy = HangUpBy.Consult;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }
  
  if (!currentHangUpBy) {
    // If this worker hung up, this would have been set in beforeHangupCall or beforeKickParticipant
    // Therefore, must be customer hangup
    currentHangUpBy = HangUpBy.Customer;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }
  
  switch (currentHangUpBy) {
    case HangUpBy.CompletedExternalWarmTransfer:
      // If the task has the destination attribute, this was a warm transfer
      currentHangUpBy = HangUpBy.ExternalWarmTransfer;
      HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      break;
    case HangUpBy.ColdTransfer:
    case HangUpBy.ExternalColdTransfer:
      break;
    case HangUpBy.ExternalWarmTransfer:
      // If we get here, it means the customer hung up before the agent could complete the warm transfer
      // Or, the external party left before the call ended, and the customer ended the call later.
      currentHangUpBy = HangUpBy.Customer;
      HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      break;
    case HangUpBy.WarmTransfer:
      // If there's no other worker but we got here, someone hung up and it wasn't us!
      if (!HangUpByHelper.hasAnotherWorkerJoined(task)) {
        currentHangUpBy = HangUpBy.Customer;
        HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
        await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
      }
      break;
    default:
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
  }
}

export const taskCompleted = async (task) => {
  console.log('taskCompleted', task);
  
  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
  
  if (currentHangUpBy === HangUpBy.ColdTransfer || currentHangUpBy === HangUpBy.WarmTransfer) {
    // reset task attribute to Customer, as the task lives on after this transfer
    // Insights has grabbed the [Cold/Warm]Transfer value already at this point
    
    // Double-check that the customer is still here
    if (HangUpByHelper.hasAnotherNonWorkerJoined(task)) {
      currentHangUpBy = HangUpBy.Customer;
      await HangUpByHelper.setHangUpByAttribute(task.taskSid, task.attributes, currentHangUpBy);
    }
  }
  
  // prevent ballooning of storage
  HangUpByHelper.clearHangUpBy(task.sid);
}
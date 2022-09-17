import { hangUpBy as HangUpByHelper } from '../../helpers';
import { HangUpBy } from '../../enums';
import { holdTime as HoldTimeHelper } from '../../helpers';
import SyncClient from "../../services/SyncIPCClient";

export const taskWrapup = async (task, attributes) => {
  const key = `${task.sid}_HoldTime`;
  
  try {
    const doc = await SyncClient.getSyncDoc(key);
    let { data } = doc;
    
    if (!data.holdTime) {
      // no holds
      data.holdTime = 0;
    }
    
    if (data.currentHoldStart && data.currentHoldStart > 0) {
      // hold in progress
      const newDoc = await HoldTimeHelper.endHold(task.sid);
      data = newDoc.data;
    }
    
    attributes.conversations.hold_time = data.holdTime;
    await SyncClient.closeSyncDoc();
  } catch (error) {
    console.error('Unable to update HoldTime during wrapup', error);
  }
  
  return attributes;
}

export const taskCompleted = async (task) => {
  try {
    let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];
    
    if ((currentHangUpBy === HangUpBy.ColdTransfer || currentHangUpBy === HangUpBy.WarmTransfer) && task && task.attributes && task.attributes.conversations && task.attributes.conversations.hold_time && task.attributes.conversations.hold_time > 0) {
      // reset hold time for the next segment
      await HoldTimeHelper.writeHoldData(task.taskSid, task.attributes, 0);
    }
  } catch (error) {
    console.error('Unable to update HoldTime during completion', error);
  }
}
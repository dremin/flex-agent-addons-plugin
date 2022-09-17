import { holdTime as HoldTimeHelper } from '../../helpers';
import SyncClient from "../../services/SyncIPCClient";

export const beforeHoldCall = async (payload) => {
  await HoldTimeHelper.startHold(payload.sid);
}

export const beforeUnholdCall = async (payload) => {
  await HoldTimeHelper.endHold(payload.sid);
}

export const beforeTransferTask = async (payload) => {
  if (payload.options.mode === "WARM") {
    await HoldTimeHelper.startHold(payload.sid);
  }
}

export const beforeCompleteTask = async (payload, attributes) => {
  const key = `${payload.sid}_HoldTime`;
  
  try {
    const doc = await SyncClient.getSyncDoc(key);
    let { data } = doc;
    
    if (!data.holdTime) {
      // no holds
      data.holdTime = 0;
    }
    
    attributes.conversations.hold_time = data.holdTime;
  } catch (error) {
    console.error('Error adding hold_time attribute during beforeCompleteTask', error);
  }
  
  return attributes;
}
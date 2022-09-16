import SyncClient from "../services/SyncIPCClient";
import TaskRouterService from '../services/TaskRouterService';

/*
Sync Doc format:
{
  currentHoldStart: Date,
  holdTime: Number
}
*/

export const startHold = async (reservationSid) => {
  console.log('HoldTime: Starting hold for reservation', reservationSid);
  const key = `${reservationSid}_HoldTime`;
  
  try {
    const doc = await SyncClient.getSyncDoc(key);
    let { data } = doc;
    
    if (isNaN(data.holdTime)) {
      data.holdTime = 0;
    }
    
    data.currentHoldStart = Date.now();
    
    const updated = await SyncClient.updateSyncDoc(key, data);
    return updated;
  } catch (error) {
    console.error('Unable to handle start hold', error);
    return {};
  }
}

export const endHold = async (reservationSid) => {
  console.log('HoldTime: Ending hold for reservation', reservationSid);
  const key = `${reservationSid}_HoldTime`;
  
  try {
    const doc = await SyncClient.getSyncDoc(key);
    let { data } = doc;
    
    if (isNaN(data.currentHoldStart) || data.currentHoldStart === 0) {
      // we never started tracking hold-abandon ship!
      return;
    }
    
    const currentHoldEnd = Date.now();
    const currentHoldDuration = (currentHoldEnd - data.currentHoldStart) / 1000;
    
    const newHoldDuration = data.holdTime + currentHoldDuration;
    
    const updated = await updateHoldTime(reservationSid, newHoldDuration);
    return updated;
  } catch (error) {
    console.error('Unable to handle end hold', error);
    return {};
  }
}

export const updateHoldTime = async (reservationSid, newHoldDuration) => {
  const key = `${reservationSid}_HoldTime`;
  
  const newData = {
    currentHoldStart: 0,
    holdTime: newHoldDuration
  };
  
  try {
    const updated = await SyncClient.updateSyncDoc(key, newData);
    return updated;
  } catch (error) {
    console.error('Unable to handle update hold', error);
    return {};
  }
}

export const writeHoldData = async (taskSid, taskAttributes, holdTime) => {
  if (taskAttributes && taskAttributes.conversations && taskAttributes.conversations.hold_time === holdTime) {
    // no change!
    return;
  }
  
  const newAttributes = {
    conversations: {
      hold_time: holdTime
    }
  }
  
  await TaskRouterService.updateTaskAttributes(taskSid, newAttributes);
  console.log(`Set hold_time attribute for ${taskSid}`, newAttributes);
}
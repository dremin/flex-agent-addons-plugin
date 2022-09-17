import TaskRouterService from '../services/TaskRouterService';
import ConferenceService from '../services/ConferenceService';
import * as Flex from "@twilio/flex-ui";

const STORAGE_KEY = 'hang_up_by';

export const resetHangUpBy = (manager) => {
  // remove all reservations from hang_up_by that are no longer assigned
  const storageValue = getHangUpBy();
  let newValue = {};
  
  const tasks = manager.store.getState().flex.worker.tasks;
  
  tasks.forEach((_value, key) => {
    if (storageValue[key]) {
      newValue[key] = storageValue[key];
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
}

export const hasExternalJoined = (task) => {
  if (task.conference) {
    const joinedExternals = task.conference.participants.filter(p => p.participantType !== "customer" && p.participantType !== "worker" && p.status === "joined");
    
    if (joinedExternals.length > 0) {
      return true;
    }
  }
  
  return false;
}

export const hasAnotherNonWorkerJoined = async (task) => {
  // Task passed to us from taskCompleted event may not have updated conference info
  let conference = Flex.Manager.getInstance().store.getState().flex.conferences.states.get(task.taskSid);
  
  if (conference && conference.source) {
    const otherNonWorkers = conference.source.participants.filter(p => p.participantType !== "worker");
    
    let joinedNonWorkers = false;
    
    for (const p of otherNonWorkers) {
      try {
        const response = await ConferenceService.fetchParticipant(conference.source.conferenceSid, p.callSid);
        
        if (response.participantsResponse && response.participantsResponse.status === "connected") {
          joinedNonWorkers = true;
          break;
        }
      } catch (error) {
        console.log('Unable to get participant from conference, it probably ended', error);
      }
    }
    
    if (joinedNonWorkers === true) {
      return true;
    }
  }
  
  return false;
}

export const hasAnotherWorkerJoined = (task) => {
  // Task passed to us from taskCompleted event may not have updated conference info
  // But where we are called from that is actually desired
  
  if ((task.incomingTransferObject || task.outgoingTransferObject) && task.conference) {
    const otherJoinedWorkers = task.conference.participants.filter(p => p.participantType === "worker" && !p.isCurrentWorker && p.status === "joined");
    
    if (otherJoinedWorkers.length > 0) {
      return true;
    }
  }
  
  return false;
}

export const hasCustomerJoined = async (task) => {
  // Task passed to us from taskCompleted event may not have updated conference info
  let conference = Flex.Manager.getInstance().store.getState().flex.conferences.states.get(task.taskSid);
  
  if (conference && conference.source) {
    const customers = conference.source.participants.filter(p => p.participantType === "customer");
    
    let joinedCustomers = false;
    
    for (const p of customers) {
      try {
        const response = await ConferenceService.fetchParticipant(conference.source.conferenceSid, p.callSid);
        
        if (response.participantsResponse && response.participantsResponse.status === "connected") {
          joinedCustomers = true;
          break;
        }
      } catch (error) {
        console.log('Unable to get participant from conference, it probably ended', error);
      }
    }
    
    if (joinedCustomers === true) {
      return true;
    }
  }
  
  return false;
}

export const getHangUpBy = () => {
  const storageValue = localStorage.getItem(STORAGE_KEY);
  
  if (!storageValue) {
    return {};
  }
  
  const parsedValue = JSON.parse(storageValue);
  
  if (!parsedValue) {
    return {};
  }
  
  return parsedValue;
}

export const setHangUpBy = (reservationSid, value) => {
  const existingValue = getHangUpBy();
  
  const newValue = {
    ...existingValue,
    [reservationSid]: value
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
  console.log(`Set ${STORAGE_KEY} for ${reservationSid} to ${value}`, newValue);
}

export const setHangUpByAttribute = async (taskSid, taskAttributes, value, destination) => {
  if (taskAttributes && taskAttributes.conversations && taskAttributes.conversations.hang_up_by === value && (!destination || taskAttributes.conversations.destination === destination)) {
    // no change!
    return;
  }
  
  let newAttributes = {
    conversations: {
      hang_up_by: value
    }
  };
  
  if (destination) {
    newAttributes.conversations.destination = destination;
  }
  
  try {
    await TaskRouterService.updateTaskAttributes(taskSid, newAttributes);
  } catch (error) {
    console.log(`Failed to set hang_up_by attribute for ${taskSid} to ${value}`, error);
  }
  console.log(`Set hang_up_by attribute for ${taskSid} to ${value}`, newAttributes);
}

export const clearHangUpBy = (reservationSid) => {
  let storage = getHangUpBy();
  
  if (storage[reservationSid]) {
    delete storage[reservationSid];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    console.log(`Removed ${STORAGE_KEY} value for ${reservationSid}`);
  }
}
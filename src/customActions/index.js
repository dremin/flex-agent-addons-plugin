import { Actions, Manager, Notifications, StateHelper, TaskHelper } from '@twilio/flex-ui';
import * as ExternalTransferActions from './externalTransfer';
import * as HangUpByActions from './hangUpBy';
import * as HoldTimeActions from './holdTime';
import * as InternalTransferActions from './internalTransfer';
import ConferenceService from '../services/ConferenceService';
import TaskRouterService from '../services/TaskRouterService';
import { CustomNotifications } from '../notifications';

export default (manager) => {
  
  Actions.addListener('beforeHoldCall', async (payload, abortFunction) => {
    await HoldTimeActions.beforeHoldCall(payload);
  });
  
  Actions.addListener('beforeUnholdCall', async (payload, abortFunction) => {
    await HoldTimeActions.beforeUnholdCall(payload);
  });

  Actions.addListener('beforeHoldParticipant', async (payload, abortFunction) => {
    const { participantType, targetSid: participantSid, task } = payload;
    
    if (participantType === 'customer') {
      await HoldTimeActions.beforeHoldCall(payload);
      return;
    }
    
    if (participantType !== 'unknown') {
      return;
    }

    const { conferenceSid } = task.conference;
    abortFunction();
    console.log('Holding participant', participantSid);
    return ConferenceService.holdParticipant(conferenceSid, participantSid);
  });

  Actions.addListener('beforeUnholdParticipant', async (payload, abortFunction) => {
    const { participantType, targetSid: participantSid, task } = payload;
    
    if (participantType === 'customer') {
      await HoldTimeActions.beforeUnholdCall(payload);
      return;
    }
    
    if (participantType !== 'unknown') {
      return;
    }

    console.log('Holding participant', participantSid);

    const { conferenceSid } = task.conference;
    abortFunction();
    return ConferenceService.unholdParticipant(conferenceSid, participantSid);
  });

  Actions.addListener('beforeKickParticipant', (payload, abortFunction) => {
    const { participantType } = payload;

    if (
      participantType !== "transfer" &&
      participantType !== 'worker'
    ) {
      abortFunction();
      ExternalTransferActions.kickExternalTransferParticipant(payload);
    }
    
    HangUpByActions.beforeKickParticipant(payload);
  });

  Actions.addListener('beforeHangupCall', async (payload, abortFunction) => {
    const { conference, taskSid } = payload.task;
    const participantsOnHold = (participant) => {
      return participant.onHold && participant.status === "joined";
    };
    const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
    const getLatestConference = taskSid => {
      const updatedTask = StateHelper.getTaskByTaskrouterTaskSid(taskSid)
      return updatedTask.conference
    }

    // check if worker hanging up is last worker on the call
    if (conference && conference.liveWorkerCount === 1) {

      //if so, ensure no other participants are on hold as 
      //no external parties will be able to remove them from being on hold.
      conference.participants.forEach(async (participant) => {
        const { participantType, workerSid, callSid } = participant;
        if (participant.onHold && participant.status === "joined") {
          await Actions.invokeAction("UnholdParticipant", {
            participantType,
            task: payload.task,
            targetSid: participantType === 'worker' ? workerSid : callSid
          });
        }
      });

      // make sure this operation blocks hanging up the call until 
      // all participants are taken off hold or max wait time is reached
      let attempts = 0;
      let updatedConference = getLatestConference(taskSid);
      let { participants } = updatedConference;
      while (participants.some(participantsOnHold) && attempts < 10) {
        await snooze(500);
        attempts++;
        updatedConference = getLatestConference(taskSid);
        participants = updatedConference.participants;
      }

      // if some participants are still on hold, abort hanging up the call
      if (updatedConference.participants.some(participantsOnHold)) {
        Notifications.showNotification(CustomNotifications.FailedHangupNotification);
        abortFunction();
        return;
      }
    }
    
    HangUpByActions.beforeHangupCall(payload);
  });
  
  Actions.addListener("beforeTransferTask", async (payload, abortAction) => {
    let abortTransfer = await InternalTransferActions.beforeTransferTask(payload);
    
    if (abortTransfer) {
      abortAction();
      return;
    }
    
    HangUpByActions.beforeTransferTask(payload);
    await HoldTimeActions.beforeTransferTask(payload);
  });
  
  Actions.addListener("beforeShowDirectory", (payload) => {
    InternalTransferActions.beforeShowDirectory(payload);
  });
  
  Actions.addListener("beforeCompleteTask", async (payload) => {
    let attributes = { conversations: {} };
    
    attributes = await HangUpByActions.beforeCompleteTask(payload, attributes);
    attributes = await HoldTimeActions.beforeCompleteTask(payload, attributes);
    
    const { attributes: workerAttributes } = Manager.getInstance().workerClient;
    attributes.conversations.conversation_attribute_9 = workerAttributes.location;
    attributes.conversations.conversation_attribute_10 = workerAttributes.manager;
    
    try {
      const task = TaskHelper.getTaskByTaskSid(payload.sid);
      await TaskRouterService.updateTaskAttributes(task.taskSid, attributes);
      console.log(`Set conversation attributes for ${task.taskSid}`, attributes);
    } catch (error) {
      console.log(`Failed to set conversation attributes for ${task.taskSid}`, error);
    }
  });
  
  Actions.registerAction("CustomExternalTransferTask", async (payload) => {
    /* payload schema:
    {
      task: ITask,
      mode: COLD | WARM,
      to: string,
      from: string,
      sipTarget?: string
    }
    */
    
    await HangUpByActions.CustomExternalTransferTask(payload);
    
    if (payload.mode == 'COLD') {
      ExternalTransferActions.doColdTransfer(payload);
    } else if (payload.mode == 'WARM') {
      ExternalTransferActions.doWarmTransfer(payload);
    }
  });
}
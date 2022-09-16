import { holdTime as HoldTimeHelper } from '../../helpers';
import SyncClient from "../../services/SyncIPCClient";
import { TaskHelper } from "@twilio/flex-ui";

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

export const beforeCompleteTask = async (payload) => {
  const key = `${payload.sid}_HoldTime`;
  
  const doc = await SyncClient.getSyncDoc(key);
  let { data } = doc;
  
  if (!data.holdTime) {
    // no holds
    data.holdTime = 0;
  }
  
  const task = TaskHelper.getTaskByTaskSid(payload.sid);
  await HoldTimeHelper.writeHoldData(task.taskSid, task.attributes, data.holdTime);
}
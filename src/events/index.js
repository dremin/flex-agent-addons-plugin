import * as HangUpByEvents from './hangUpBy';
import * as HoldTimeEvents from './holdTime';
import TaskRouterService from '../services/TaskRouterService';

export default (manager) => {
  manager.events.addListener("taskWrapup", async (task) => {
    let attributes = { conversations: {} };
    
    attributes = await HangUpByEvents.taskWrapup(task, attributes);
    attributes = await HoldTimeEvents.taskWrapup(task, attributes);
    
    try {
      await TaskRouterService.updateTaskAttributes(task.taskSid, attributes);
      console.log(`Set conversation attributes for ${task.taskSid}`, attributes);
    } catch (error) {
      console.log(`Failed to set conversation attributes for ${task.taskSid}`, error);
    }
  });
  
  manager.events.addListener("taskCompleted", async (task) => {
    await HoldTimeEvents.taskCompleted(task);
    
    // HangUpBy gets reset here, so do things relying on the old value beforehand
    await HangUpByEvents.taskCompleted(task);
  });
}
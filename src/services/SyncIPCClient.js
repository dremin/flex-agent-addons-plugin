import { Actions } from '@twilio/flex-ui';
import { v4 as uuidv4 } from 'uuid'; // Each request needs a UUID so that Flex doesn't error during concurrent requests

class SyncIPCClient {
  #cache;

  constructor() {
    this.#cache = {};
    
    Actions.addListener("afterSyncDocIPC", async (payload) => {
      switch (payload.mode) {
        case 'GET':
        case 'UPDATE':
          this.#cache[payload.docName] = {
            data: payload.data
          }
          break;
        case 'CLOSE':
          break;
      }
    });
  }

  /**
   * Returns the Sync Document instance
   * @param docName the Sync Document to return
   */
  getSyncDoc = async (docName) => {
    try {
      await Actions.invokeAction("SyncDocIPC", { mode: 'GET', docName, requestId: uuidv4() });
    } catch {
      console.error('Unable to invoke SyncDocIPC action. Are you missing a plugin?');
    }
    
    return this.#cache[docName];
  };

  /**
   * This is where we update the Sync Document
   * @param docName the doc name to update
   * @param data the object to update the doc with
   */
  updateSyncDoc = async (docName, data) => {
    try {
      await Actions.invokeAction("SyncDocIPC", { mode: 'UPDATE', docName, data, requestId: uuidv4() });
    } catch {
      console.error('Unable to invoke SyncDocIPC action. Are you missing a plugin?');
    }
    return this.#cache[docName];
  };

  /**
   * Called when we wish to close/unsubscribe from a specific sync document
   * @param docName the doc name to close
   */
  closeSyncDoc = async (docName) => {
    try {
      await Actions.invokeAction("SyncDocIPC", { mode: 'CLOSE', docName, requestId: uuidv4() });
    } catch {
      console.error('Unable to invoke SyncDocIPC action. Are you missing a plugin?');
    }
  };
}

const syncIpcClient = new SyncIPCClient();

export default syncIpcClient;

import { Manager } from '@twilio/flex-ui';
import { SyncClient as TwilioSyncClient } from 'twilio-sync';

class SyncClient {
  #client;

  constructor(manager) {
    this.#client = new TwilioSyncClient(manager.user.token);
    
    manager.events.addListener('tokenUpdated', (tokenPayload) => {
      console.log('Refreshing SyncClient Token');
      this.#client.updateToken(tokenPayload.token);
    });
  }

  /**
   * Returns the Sync Document instance
   * @param docName the Sync Document to return
   */
  getSyncDoc = async (docName) => {
    return this.#client.document({ id: docName, ttl: 1209600 });
  };

  /**
   * This is where we update the Sync Document
   * @param docName the doc name to update
   * @param data the object to update the doc with
   */
  updateSyncDoc = async (docName, data) => {
    const doc = await this.getSyncDoc(docName);
    return await doc.update(data, { ttl: 1209600 });
  };

  /**
   * Called when we wish to close/unsubscribe from a specific sync document
   * @param docName the doc name to close
   */
  closeSyncDoc = async (docName) => {
    const doc = await this.getSyncDoc(docName);
    doc.close();
  };
}

const syncClient = new SyncClient(Manager.getInstance());

export default syncClient;

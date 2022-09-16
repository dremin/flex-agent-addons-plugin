import { FlexPlugin } from '@twilio/flex-plugin';
import * as Flex from "@twilio/flex-ui";
import reducers, { namespace } from './states';
import { Action } from './states/DirectoryState';
import CustomDirectoryContainer from "./components/CustomDirectory/CustomDirectory.Container";
import registerCustomActions from './customActions';
import registerCustomEvents from './events';
import registerCustomNotifications from './notifications';
import { loadExternalTransferInterface } from './components/ExternalTransfer';
import { CustomizationProvider } from "@twilio-paste/core/customization";
import { resetHangUpBy } from './helpers/hangUpBy';
import { Actions as QueueHoopsActions} from './states/QueueHoopsState';
import { handlebars, queueHoops } from './helpers';
import { initializeStrings } from './strings';
import TaskRouterService from './services/TaskRouterService';

const PLUGIN_NAME = 'AgentAddonsPlugin';

export default class AgentAddonsPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  init(flex, manager) {
    
    Flex.setProviders({
        PasteThemeProvider: CustomizationProvider,
    });

    loadExternalTransferInterface.bind(this)(flex, manager);
    
    this.registerReducers(manager);
    this.dispatch(Action.getDirectory());

    flex.WorkerDirectory.Tabs.Content.add(
      <flex.Tab
        key="customer-directory-container"
        label="Directory">
        <CustomDirectoryContainer key="customer-directory-container" />
      </flex.Tab>
    );

    resetHangUpBy(manager);
    
    initializeStrings();
    registerCustomActions(manager);
    registerCustomEvents(manager);
    registerCustomNotifications(flex, manager);
    
    handlebars.registerHelpers();
    
    try {
      queueHoops.loadHoops(QueueHoopsActions.storeQueueHoops);
      
      TaskRouterService.getWorkflows()
        .then(console.log('Workflows were retrieved'));
    } catch (error) {
      console.log('Unable to initialize internal transfer addons', error);
    }
    
    // Removing the Agent tab from the transfer directory to disable
    // transferring directly to an agent instead of a queue
    const internalTransferAddonsPluginConfig = manager.serviceConfiguration.ui_attributes?.internalTransferAddonsPlugin;
    const isAgentTransferDirectoryDisabled = internalTransferAddonsPluginConfig?.agentTransferDirectory?.isGloballyDisabled;
    const agentTransferDirectoryEnabledSkills = internalTransferAddonsPluginConfig?.agentTransferDirectory?.enabledSkills || [];
    const workerSkills = manager.workerClient.attributes?.routing?.skills || [];
    const isAgentTransferDirectorEnabledForMe = workerSkills.some(s => agentTransferDirectoryEnabledSkills.includes(s));
    
    if (isAgentTransferDirectoryDisabled && !isAgentTransferDirectorEnabledForMe) {
      flex.WorkerDirectoryTabs.Content.remove('workers');
    }
  }

  dispatch = (f) => Flex.Manager.getInstance().store.dispatch(f);

  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint-disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}

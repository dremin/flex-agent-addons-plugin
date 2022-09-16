import { Manager } from '@twilio/flex-ui';

const manager = Manager.getInstance();

export const initializeStrings = () => {
  const isHoopsEnabled = manager.serviceConfiguration.ui_attributes?.internalTransferAddonsPlugin?.isHoopsEnabled;

  if (isHoopsEnabled) {
    const closedStyle = 'color:maroon';

    // This modified directory queue item string makes it easy for agents
    // to see if a queue is closed before transferring to it, and the hours
    // of operation for that queue by hovering over text on that queue item.
    // See this link for more information on templating support in Flex.
    // https://www.twilio.com/docs/flex/developer/ui/localization-and-templating#templating-support-with-mustache-style-syntax
    manager.strings.WorkerDirectoryQueueItemText = `
      {{#IsWorkerDirectoryQueueClosed queue}}
        <div title="{{queueHours}}">{{queue.name}}</div>
        <div title="{{queueHours}}">
          <span style=${closedStyle}>CLOSED </span>
          {{#if isTodayHoliday}}
            <span style=${closedStyle}>Holiday </span>
          {{/if}}
          <span>(Hover for hours)</span>
        </div>
      {{else}}
        {{queue.name}}
      {{/IsWorkerDirectoryQueueClosed}}
    `;
  }
};


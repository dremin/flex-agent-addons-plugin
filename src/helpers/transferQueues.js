import { Manager } from '@twilio/flex-ui';

import { utils } from '../helpers';

const manager = Manager.getInstance();
const maxExpressionArraySize = 29;

const generateStaticQueueFilterExpression = () => {
  const hiddenTransferQueues = manager.serviceConfiguration.ui_attributes?.internalTransferAddonsPlugin?.hiddenTransferQueues;

  let expression = "";

  if (!Array.isArray(hiddenTransferQueues) || hiddenTransferQueues.length === 0) {
    expression = "";
  } else if (hiddenTransferQueues.length <= 29) {
    expression = `data.queue_name NOT_IN ${JSON.stringify(hiddenTransferQueues)}`;
  } else {
    const hiddenQueueChunks = utils.sliceArrayIntoChunks(hiddenTransferQueues, maxExpressionArraySize);

    for (let i = 0; i < hiddenQueueChunks.length; i++) {
      const chunk = hiddenQueueChunks[i];
      expression += `data.queue_name NOT_IN ${JSON.stringify(chunk)}`;

      if (i + 1 < hiddenQueueChunks.length) {
        expression += ' AND ';
      }
    }
  }

  return expression;
}

const isFilterNameInQueueName = (filterName, queueName) => {
  const normalizedQueueName = queueName.toLowerCase();
  const normalizedFilterName = filterName.toLowerCase();

  return normalizedQueueName === normalizedFilterName ||
  normalizedQueueName.startsWith(`${normalizedFilterName} `) ||
  normalizedQueueName.includes(` ${normalizedFilterName} `) ||
  normalizedQueueName.endsWith(` ${normalizedFilterName}`)
}

const generateLobAndChannelQueueFilterExpression = (queueName, taskChannelName) => {
  // Filtering out queues not associated with the task queue's Line of Business or task channel
  const internalTransferAddonsPluginConfig = manager.serviceConfiguration.ui_attributes?.internalTransferAddonsPlugin;
  const lobTransferQueueFilter = internalTransferAddonsPluginConfig?.lobTransferQueueFilter || {};
  const channelTransferQueueFilter = internalTransferAddonsPluginConfig?.channelTransferQueueFilter || {};
  const queueHoops = manager.store.getState()['internal-transfer-addons']?.queueHoops || {};
  const queueList = Object.values(queueHoops).flatMap(v => v.friendlyName ? v.friendlyName : []);

  let expression = "";
  let matchingLobFilter = [];
  let matchingLobFilterKey = "";
  let matchingChannelFilter = channelTransferQueueFilter[taskChannelName] || [];
  let matchingQueues = [];

  for (const key of Object.keys(lobTransferQueueFilter)) {
    if (queueName?.toLowerCase().startsWith(key.toLowerCase())) {
      if (key.length > matchingLobFilterKey.length) {
        // In case there are multiple possible matches for a queue name,
        // we want the most expressive match
        matchingLobFilterKey = key;
        matchingLobFilter = lobTransferQueueFilter[key];
      }
    }
  }

  let filterExclusions = [];
  for (const filter of matchingLobFilter) {
    if (filter.startsWith('!')) {
      // ! at the start of the filter name indicates this queue should be excluded
      filterExclusions.push(filter.substring(1));
      continue;
    }

    for (const queue of queueList) {
      if (isFilterNameInQueueName(filter, queue)) {
        matchingQueues.push(queue);
      }
    }
  }

  matchingQueues = matchingQueues.filter(q => {
    let isExcluded = false;
    // Removing any queues that were excluded in the filter config
    for (const filter of filterExclusions) {
      if (isFilterNameInQueueName(filter, q)) {
        isExcluded = true;
      }
    }
    // Ensuring only queues intended for tasks of the selected task's channel are included
    for (const filter of matchingChannelFilter) {
      if (filter.startsWith('!')) {
        if (isFilterNameInQueueName(filter.substring(1), q)) {
          isExcluded = true;
        }
      } else if (!isFilterNameInQueueName(filter, q)) {
        isExcluded = true;
      }
    }
    return isExcluded ? false : true;
  });

  if (matchingQueues.length > 0 && matchingQueues.length <= 29) {
    expression = `data.queue_name IN ${JSON.stringify(matchingQueues)}`;
  } else if (matchingQueues.length > 29) {
    const matchingQueueChunks = utils.sliceArrayIntoChunks(matchingQueues, maxExpressionArraySize);

    for (let i = 0; i < matchingQueueChunks.length; i++) {
      const chunk = matchingQueueChunks[i];
      expression += `data.queue_name IN ${JSON.stringify(chunk)}`;

      if (i + 1 < matchingQueueChunks.length) {
        expression += ' OR ';
      }
    }
  }

  return expression;
}

export const getQueueFilterExpression = (queueName, taskChannelName) => {
  const staticQueueFilterExpression = generateStaticQueueFilterExpression();

  // Setting to an empty string if the status queue filter expression is null
  // in case other filter expressions need to be appended in the future
  let finalQueueFilterExpression = staticQueueFilterExpression
    ? `(${staticQueueFilterExpression})`
    : ''
  
  const lobQueueFilterExpression = generateLobAndChannelQueueFilterExpression(queueName, taskChannelName);
  
  if (lobQueueFilterExpression) {
    finalQueueFilterExpression += ` AND (${lobQueueFilterExpression})`;
  }
  
  return finalQueueFilterExpression;
}

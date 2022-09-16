import { combineReducers } from 'redux';

import { reduce as DirectoryReducer } from './DirectoryState';
import { reduce as QueueHoopsReducer } from './QueueHoopsState';

// Register your redux store under a unique namespace
export const namespace = 'agent-addons';

// Combine the reducers
export default combineReducers({
    DirectoryReducer: DirectoryReducer,
    queueHoops: QueueHoopsReducer
});
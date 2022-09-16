const ACTION_STORE_QUEUE_HOOPS = 'STORE_QUEUE_HOOPS';

const initialState = {
};

export class Actions {
  static storeQueueHoops = (queueHoops) => {
    return ({ type: ACTION_STORE_QUEUE_HOOPS, payload: queueHoops })};
}

export function reduce(state = initialState, action) {
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (action.type) {
    case ACTION_STORE_QUEUE_HOOPS: {
      return {
        ...state,
        ...action.payload
      };
    }

    default:
      return state;
  }
}

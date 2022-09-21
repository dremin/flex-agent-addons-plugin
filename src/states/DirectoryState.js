import { Manager, Notifications } from "@twilio/flex-ui";
import { CustomNotifications } from "../notifications";

const GET_DIRECTORY_LIST = "GET_DIRECTORY_LIST";

const initialState = {
  SelectedDirectory: "",
  directoryList: [],
  response_status: "Pending",
  error: "",
};

function getDirectoryList() {
  const directoryUrl = Manager.getInstance().serviceConfiguration.ui_attributes.directoryUrl;
  return fetch(directoryUrl)
    .then((response) => response.json())
    .catch((err) => {
      return `Error: ${err}`;
    });
}

export class Action {
  static getDirectory = () => ({
    type: GET_DIRECTORY_LIST,
    payload: getDirectoryList(),
  });
}

export function reduce(state = initialState, action) {
  switch (action.type) {
    case `${GET_DIRECTORY_LIST}_PENDING`: {
      return state;
    }

    case `${GET_DIRECTORY_LIST}_FULFILLED`: {
      if (String(action.payload).startsWith("Error: ")) {
        Notifications.showNotification(
          CustomNotifications.DirectoryLoadNotification,
          null
        );
        return {
          ...state,
          error: action.payload,
          response_status: "Error",
        };
      } else {
        return {
          ...state,
          directoryList: action.payload,
          response_status: "Okay",
        };
      }
    }

    case `${GET_DIRECTORY_LIST}_REJECTED`: {
      Notifications.showNotification(
        CustomNotifications.DirectoryLoadNotification,
        null
      );
      return {
        ...state,
        error: action.payload.error,
        response_status: "Error",
      };
    }

    default:
      return state;
  }
}

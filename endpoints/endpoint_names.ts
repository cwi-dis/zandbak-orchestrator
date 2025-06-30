import { Dict } from "../util";

enum EndpointNames {
  LOGIN = "Login",
  LOGOUT = "Logout",

  ADD_SESSION = "AddSession",
  DELETE_SESSION = "DeleteSession",
  JOIN_SESSION = "JoinSession",
  LEAVE_SESSION = "LeaveSession",
  GET_SESSION_INFO = "GetSessionInfo",
  GET_SESSIONS = "GetSessions",
  SET_SESSION_STATUS = "SetSessionStatus",
  SET_SESSION_PRESENTATION = "SetSessionPresentation",
  SCHEDULE_SESSION = "ScheduleSession",
  CHANGE_SLIDE = "ChangeSlide",

  GET_USER_DATA = "GetUserData",
  UPDATE_USER_DATA = "UpdateUserDataJson",

  SEND_MESSAGE = "SendMessage",
  SEND_MESSAGE_TO_ALL = "SendMessageToAll",
  GET_MESSAGES = "GetMessages",

  RAISE_HAND = "RaiseHand",
  CLEAR_RAISED_HAND = "ClearRaisedHand",
  GET_RAISED_HANDS = "GetRaisedHands",

  SEND_SCENE_EVENT_TO_MASTER = "SendSceneEventToMaster",
  SEND_SCENE_EVENT_TO_USER = "SendSceneEventToUser",
  SEND_SCENE_EVENT_TO_ALL = "SendSceneEventToAllUsers",

  DECLARE_DATA_STREAM = "DeclareDataStream",
  REMOVE_DATA_STREAM = "RemoveDataStream",
  REGISTER_FOR_DATA_STREAM = "RegisterForDataStream",
  UNREGISTER_FROM_DATA_STREAM = "UnregisterFromDataStream",
  SEND_DATA = "SendData",

  BROADCAST = "Broadcast",

  GET_ORCHESTRATOR_VERSION = "GetOrchestratorVersion",
  GET_NTP_TIME = "GetNTPTime",
  DUMP_DATA = "DumpData",
  TERMINATE_ORCHESTRATOR = "TerminateOrchestrator"
}

export type SessionEventName =
  "USER_LEFT_SESSION" |
  "USER_JOINED_SESSION" |
  "USER_RAISED_HAND" |
  "USER_CLEARED_RAISED_HAND" |
  "SESSION_STATUS_CHANGED" |
  "PRESENTATION_CHANGED" |
  "SLIDE_CHANGED";

export interface SessionEvent {
  eventId: SessionEventName,
  eventData: Dict
}

export default EndpointNames;

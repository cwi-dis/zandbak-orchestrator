enum EndpointNames {
  LOGIN = "Login",
  LOGOUT = "Logout",

  ADD_SESSION = "AddSession",
  DELETE_SESSION = "DeleteSession",
  JOIN_SESSION = "JoinSession",
  LEAVE_SESSION = "LeaveSession",
  GET_SESSION_INFO = "GetSessionInfo",
  GET_SESSIONS = "GetSessions",

  GET_USER_DATA = "GetUserData",
  UPDATE_USER_DATA = "UpdateUserDataJson",

  SEND_MESSAGE = "SendMessage",
  SEND_MESSAGE_TO_ALL = "SendMessageToAll",

  SEND_SCENE_EVENT_TO_MASTER = "SendSceneEventToMaster",
  SEND_SCENE_EVENT_TO_USER = "SendSceneEventToUser",
  SEND_SCENE_EVENT_TO_ALL = "SendSceneEventToAllUsers",

  DECLARE_DATA_STREAM = "DeclareDataStream",
  REMOVE_DATA_STREAM = "RemoveDataStream",
  REGISTER_FOR_DATA_STREAM = "RegisterForDataStream",
  UNREGISTER_FROM_DATA_STREAM = "UnregisterFromDataStream",
  SEND_DATA = "SendData",

  GET_ORCHESTRATOR_VERSION = "GetOrchestratorVersion",
  GET_NTP_TIME = "GetNTPTime",
  DUMP_DATA = "DumpData"
}

export default EndpointNames;

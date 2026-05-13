enum EndpointNames {
  LOGIN = "Login",
  LOGOUT = "Logout",

  ADD_SESSION = "AddSession",
  DELETE_SESSION = "DeleteSession",
  JOIN_SESSION = "JoinSession",
  LEAVE_SESSION = "LeaveSession",
  GET_SESSION_INFO = "GetSessionInfo",
  GET_SESSIONS = "GetSessions",
  GET_ROOMS = "GetRooms",
  GET_SCHEDULED_SESSIONS = "GetScheduledSessions",
  SET_SESSION_STATUS = "SetSessionStatus",
  SET_SESSION_PRESENTATION = "SetSessionPresentation",
  SCHEDULE_SESSION = "ScheduleSession",
  CHANGE_SLIDE = "ChangeSlide",
  IS_SHARING = "IsSharing",

  CREATE_BUBBLE = "CreateBubble",
  GET_BUBBLE = "GetBubble",
  JOIN_BUBBLE = "JoinBubble",
  LEAVE_BUBBLE = "LeaveBubble",
  LIST_BUBBLES = "ListBubbles",
  REQUEST_JOIN_BUBBLE = "RequestJoinBubble",
  APPROVE_BUBBLE_JOIN_REQUEST = "ApproveJoinBubble",
  SEND_BUBBLE_INVITATION = "SendBubbleInvitation",

  GET_USER_DATA = "GetUserData",
  UPDATE_USER_DATA = "UpdateUserDataJson",
  SET_USER_STATUS = "SetUserStatus",
  GET_USER_INFO = "GetUserInfo",

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
  TERMINATE_ORCHESTRATOR = "TerminateOrchestrator",

  IS_SPEAKING = "IsSpeaking",

  REGISTER_SHARED_OBJECT = "RegisterSharedObject",
  REGISTER_TRIGGER = "RegisterTrigger",
  CLAIM_OWNERSHIP = "ClaimOwnership"
}

export default EndpointNames;

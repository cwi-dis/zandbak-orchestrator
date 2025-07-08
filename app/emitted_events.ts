import { Dict } from "../util";

enum EmittedEvents {
  SESSION_CLOSED = "SessionClosed",
  SESSION_UPDATED = "SessionUpdated",

  MESSAGE_SENT = "MessageSent",
  DATA_RECEIVED = "DataReceived",
  BROADCAST = "Broadcast",

  SCENE_EVENT_TO_MASTER = "SceneEventToMaster",
  SCENE_EVENT_TO_USER = "SceneEventToUser"
}

export type SessionEventName =
  "USER_LEFT_SESSION" |
  "USER_JOINED_SESSION" |
  "USER_RAISED_HAND" |
  "USER_CLEARED_RAISED_HAND" |
  "USER_DATA_UPDATED" |
  "SESSION_STATUS_CHANGED" |
  "PRESENTATION_CHANGED" |
  "SLIDE_CHANGED";

export interface SessionEvent {
  eventId: SessionEventName,
  eventData: Dict
}

export default EmittedEvents;

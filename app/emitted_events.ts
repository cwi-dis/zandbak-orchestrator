import { Dict } from "../util";

enum EmittedEvents {
  ORCHESTRATOR_UPDATED = "OrchestratorUpdated",
  BUBBLE_UPDATED = "BubbleUpdated",

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
  "USER_STATUS_UPDATED" |
  "SESSION_STATUS_CHANGED" |
  "PRESENTATION_CHANGED" |
  "PRESENTATION_IS_SHARING" |
  "USER_LEFT_BUBBLE" |
  "SLIDE_CHANGED" |
  "USER_IS_SPEAKING";

export interface SessionEvent {
  eventId: SessionEventName,
  eventData: Dict
}

export type OrchestratorEventName =
  "SESSION_CREATED" |
  "SESSION_DELETED";

export interface OrchestratorEvent {
  eventId: OrchestratorEventName,
  eventData: Dict
}

export type BubbleEventName =
  "BUBBLE_JOIN_REQUESTED" |
  "BUBBLE_JOIN_REQUEST_APPROVED";

export interface BubbleEvent {
  eventId: BubbleEventName,
  eventData: Dict
}

export default EmittedEvents;

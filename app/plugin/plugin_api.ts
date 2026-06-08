import User from "../user";
import EndpointNames from "../../endpoints/endpoint_names";
import { Vector3, Quaternion } from "../../util";

/**
 * Helper class for plugins to interact with the orchestrator endpoints
 * using a typed, method-based API instead of raw socket events.
 */
export default class PluginAPI {
  constructor(private user: User) {}

  /**
   * Internal helper to emit a socket event and wait for a response via callback.
   */
  private emit(endpoint: string, ...args: any[]): Promise<any> {
    return new Promise((resolve) => {
      // We append a callback to the arguments.
      // Most handlers in the orchestrator expect a callback as the last argument.
      this.user.socket.emit(endpoint as any, ...args, (response: any) => {
        resolve(response);
      });
    });
  }

  /**
   * Internal helper for fire-and-forget events.
   */
  private emitForget(endpoint: string, ...args: any[]): void {
    this.user.socket.emit(endpoint as any, ...args);
  }

  // Connection Management
  public login(data: { userName: string, password?: string, deviceType?: string, prefabName?: string, id?: string }) {
    return this.emit(EndpointNames.LOGIN, data);
  }

  public logout() {
    return this.emit(EndpointNames.LOGOUT, {});
  }

  // Session Management
  public addSession(data: {
    sessionName: string,
    sessionDescription?: string,
    sessionRoom: string,
    sessionProtocol?: string,
    persistent?: boolean
  }) {
    return this.emit(EndpointNames.ADD_SESSION, data);
  }

  public scheduleSession(sessionId: string) {
    return this.emit(EndpointNames.SCHEDULE_SESSION, { sessionId });
  }

  public deleteSession(sessionId: string) {
    return this.emit(EndpointNames.DELETE_SESSION, { sessionId });
  }

  public getSessions() {
    return this.emit(EndpointNames.GET_SESSIONS, {});
  }

  public getRooms() {
    return this.emit(EndpointNames.GET_ROOMS, {});
  }

  public getScheduledSessions() {
    return this.emit(EndpointNames.GET_SCHEDULED_SESSIONS, {});
  }

  public getSessionInfo() {
    return this.emit(EndpointNames.GET_SESSION_INFO, {});
  }

  public joinSession(sessionId: string) {
    return this.emit(EndpointNames.JOIN_SESSION, { sessionId });
  }

  public leaveSession() {
    return this.emit(EndpointNames.LEAVE_SESSION, {});
  }

  public getMessages() {
    return this.emit(EndpointNames.GET_MESSAGES, {});
  }

  public sendMessageToAll(message: string) {
    return this.emit(EndpointNames.SEND_MESSAGE_TO_ALL, { message });
  }

  public sendMessage(targetId: string, message: string) {
    return this.emit(EndpointNames.SEND_MESSAGE, { targetId, message });
  }

  public setSessionStatus(status: string) {
    return this.emit(EndpointNames.SET_SESSION_STATUS, { status });
  }

  public setSessionPresentation(presentationId: string) {
    return this.emit(EndpointNames.SET_SESSION_PRESENTATION, { presentationId });
  }

  public changeSlide(slideIndex: number) {
    return this.emit(EndpointNames.CHANGE_SLIDE, { slideIndex });
  }

  public setIsSharing(isSharing: boolean) {
    return this.emit(EndpointNames.IS_SHARING, { isSharing });
  }

  public raiseHand() {
    return this.emit(EndpointNames.RAISE_HAND, {});
  }

  public clearRaisedHand() {
    return this.emit(EndpointNames.CLEAR_RAISED_HAND, {});
  }

  public getRaisedHands() {
    return this.emit(EndpointNames.GET_RAISED_HANDS, {});
  }

  public setIsSpeaking(isSpeaking: boolean) {
    return this.emit(EndpointNames.IS_SPEAKING, { isSpeaking });
  }

  // Shared Objects
  public registerSharedObject(id: string, position: Vector3, rotation: Quaternion) {
    return this.emit(EndpointNames.REGISTER_SHARED_OBJECT, { id, position, rotation });
  }

  public registerTrigger(id: string, initialValue: any) {
    return this.emit(EndpointNames.REGISTER_TRIGGER, { id, initialValue });
  }

  public getTrigger(id: string) {
    return this.emit(EndpointNames.REGISTER_TRIGGER, { id });
  }

  public claimOwnership(objectId: string, type: "object" | "trigger") {
    return this.emit(EndpointNames.CLAIM_OWNERSHIP, { objectId, type });
  }

  public spawnSharedObject(id: string, position: Vector3, rotation: Quaternion, prefabName: string) {
    return this.emit(EndpointNames.SPAWN_SHARED_OBJECT, { id, position, rotation, prefabName });
  }

  public destroySharedObject(id: string) {
    return this.emit(EndpointNames.DESTROY_SHARED_OBJECT, { id });
  }

  // User Data
  public getUserData(userId?: string) {
    return this.emit(EndpointNames.GET_USER_DATA, { userId });
  }

  public updateUserData(userDataJson: string) {
    return this.emit(EndpointNames.UPDATE_USER_DATA, { userDataJson });
  }

  public setUserStatus(status: string) {
    return this.emit(EndpointNames.SET_USER_STATUS, { status });
  }

  public getUserInfo() {
    return this.emit(EndpointNames.GET_USER_INFO, {});
  }

  // Scene Events
  public sendSceneEventToMaster(sceneEvent: any) {
    return this.emit(EndpointNames.SEND_SCENE_EVENT_TO_MASTER, sceneEvent);
  }

  public sendSceneEventToUser(targetId: string, sceneEvent: any) {
    return this.emit(EndpointNames.SEND_SCENE_EVENT_TO_USER, targetId, sceneEvent);
  }

  public sendSceneEventToAll(sceneEvent: any) {
    return this.emit(EndpointNames.SEND_SCENE_EVENT_TO_ALL, sceneEvent);
  }

  // Bubbles
  public createBubble(bubbleName?: string) {
    return this.emit(EndpointNames.CREATE_BUBBLE, { name: bubbleName });
  }

  public getBubble(bubbleId: string) {
    return this.emit(EndpointNames.GET_BUBBLE, { bubbleId });
  }

  public joinBubble(bubbleId: string) {
    return this.emit(EndpointNames.JOIN_BUBBLE, { bubbleId });
  }

  public leaveBubble() {
    return this.emit(EndpointNames.LEAVE_BUBBLE, {});
  }

  public listBubbles() {
    return this.emit(EndpointNames.LIST_BUBBLES, {});
  }

  public requestJoinBubble(bubbleId: string) {
    return this.emit(EndpointNames.REQUEST_JOIN_BUBBLE, { bubbleId });
  }

  public approveBubbleJoinRequest(bubbleId: string, userId: string) {
    return this.emit(EndpointNames.APPROVE_BUBBLE_JOIN_REQUEST, { bubbleId, userId });
  }

  public sendBubbleInvitation(bubbleId: string, userId: string) {
    return this.emit(EndpointNames.SEND_BUBBLE_INVITATION, { bubbleId, userId });
  }

  // Data Streams
  public declareDataStream(streamType: string, streamDescription: string) {
    return this.emit(EndpointNames.DECLARE_DATA_STREAM, streamType, streamDescription);
  }

  public removeDataStream(streamType: string) {
    return this.emit(EndpointNames.REMOVE_DATA_STREAM, streamType);
  }

  public registerForDataStream(fromUserId: string, streamType: string) {
    return this.emit(EndpointNames.REGISTER_FOR_DATA_STREAM, fromUserId, streamType);
  }

  public unregisterFromDataStream(fromUserId: string, streamType: string) {
    return this.emit(EndpointNames.UNREGISTER_FROM_DATA_STREAM, fromUserId, streamType);
  }

  public sendData(streamType: string, data: any) {
    this.emitForget(EndpointNames.SEND_DATA, streamType, data);
  }

  public broadcast(channel: string, data: any, deliverToCaller: boolean = false) {
    this.emitForget(EndpointNames.BROADCAST, channel, data, deliverToCaller);
  }

  // Util
  public getOrchestratorVersion() {
    return this.emit(EndpointNames.GET_ORCHESTRATOR_VERSION, {});
  }

  public getNTPTime() {
    return this.emit(EndpointNames.GET_NTP_TIME, {});
  }

  public dumpData() {
    return this.emit(EndpointNames.DUMP_DATA, {});
  }
}

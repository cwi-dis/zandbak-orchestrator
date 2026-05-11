import { v4 as uuidv4 } from "uuid";

import { Dict, Optional } from "../util";
import Serializable from "./serializable";
import User from "./user";
import Transport from "../transport/transport";
import TransportManager, { TransportType } from "../transport/manager/transport_manager";
import EmittedEvents, { SessionEvent, SessionEventName } from "./emitted_events";
import ChatMessage, { PrivateMessage } from "./chat_message";
import Presentation from "./presentation";
import Bubble from "./bubble";
import Room from "./room";
import SharedObject from "./shared_object";

class Session extends Serializable {
  #id: string = uuidv4();
  #users: Array<User> = [];
  #administrator?: User;
  #objects: Array<SharedObject> = [];
  #chat: Array<ChatMessage> = [];
  #raisedHands: Array<User> = [];
  #master?: User;
  #transport: Transport;
  #channels: Array<string>;
  #bubbles: Array<Bubble> = [];
  #room: Room;
  #persistent: boolean;

  #status: string = "scheduled";
  schedule: Array<Presentation> = [];
  currentPresentation?: Presentation;

  public constructor(
    public name: string,
    public description: string,
    public sessionProtocol: TransportType,
    channels: Array<string>,
    transportManager: TransportManager,
    hostname: string,
    persistent = false,
    room: Room
  ) {
    super();

    this.#transport = transportManager.assignTransport(sessionProtocol, this, hostname);
    this.#channels = channels.map((c) => this.getInternalChannelName(c));
    this.#persistent = persistent;
    this.#room = room;
  }

  public get id() {
    return this.#id;
  }

  public get transport() {
    return this.#transport;
  }

  public get administrator() {
    return this.#administrator;
  }

  public get master() {
    return this.#master;
  }

  public get channels() {
    return this.#channels.map((channel) => channel.split("/")[1]);
  }

  public get raisedHands() {
    return this.#raisedHands;
  }

  public get status() {
    return this.#status;
  }

  public set status(status: string) {
    this.#status = status;
    this.sendSessionUpdate("SESSION_STATUS_CHANGED", { status: this.#status });
  }

  public get persistent() {
    return this.#persistent;
  }

  public get room() {
    return this.#room;
  }

  /**
   * Sets the given user to be the administrator of the session.
   *
   * @param user The user to be the session's administrator
   */
  public setAdministrator(user: User) {
    if (this.hasUser(user)) {
      this.#administrator = user;
    }
  }

  /**
   * Checks whether the session is empty, i.e. has no users that have currently
   * joined the session.
   *
   * @returns True if the session is empty, false otherwise
   */
  public isEmpty(): boolean {
    return this.#users.length == 0;
  }

  /**
   * Selects a new master user. If the session has a master and that master is
   * still present in the session, nothing happens. Otherwise, the first user
   * that can be master will be selected as new master. If there are no users
   * present that can be master, or there are no more users present, the master
   * is set to undefined.
   */
  private selectMaster() {
    if (this.#master && this.hasUser(this.#master)) {
      return;
    }

    this.#master = this.#users.filter((u) => u.canBeMaster)?.[0];
  }

  /**
   * Adds the given user to the session and notifies all currently joined users
   * of the new user.
   *
   * @param user User to add to the session
   */
  public addUser(user: User) {
    this.sendSessionUpdate("USER_JOINED_SESSION", {
      userId: user.id,
      userData: user.serialize()
    });

    this.addUserToChannels(user);
    this.#users.push(user);
    this.selectMaster();
    user.session = this;
  }

  /**
   * Removes the given user to the session and notifies all currently joined
   * users of the change. If the parameter `force` is set to true, the user
   * should be forcefully removed from the session (e.g. the user was removed
   * from the session by an admin).
   *
   * @param user User to remove from the session
   * @param force Forcefully remove the user
   */
  public removeUser(user: User, force = false) {
    this.sendSessionUpdate("USER_LEFT_SESSION", { userId: user.id, force });

    this.removeUserFromChannels(user);
    this.removeUserFromBubbles(user);

    this.#users = this.#users.filter((u) => u.id != user.id);

    this.selectMaster();
    user.session = undefined;
  }

  /**
   * Retrieves a user identified by the given ID from the session.
   *
   * @param userId ID of the user to retrieve
   * @returns The user identified by the given ID, undefined if no such user
   */
  public getUser(userId: string): Optional<User> {
    return this.#users.find((u) => u.id == userId);
  }

  /**
   * Checks whether a given user is in this session.
   *
   * @param user User to check
   * @returns True if the user is in the session, false otherwise
   */
  public hasUser(user: User): boolean {
    return !!this.getUser(user.id);
  }

  /**
   * Sets the value of the isSpeaking flag for the given user and returns true
   * if the flag was set successfully. If the given user is not in this session,
   * false is returned.
   *
   * @param user User to set the speaking flag for
   * @param status Value to set the flag to
   * @returns True if the flag was set successfully, false otherwise
   */
  public setSpeakingUser(user: User, status: boolean): boolean {
    const foundUser = this.getUser(user.id);

    if (!foundUser) {
      return false;
    }

    foundUser.isSpeaking = status;
    this.sendSessionUpdate("USER_IS_SPEAKING", {
      userId: foundUser.id,
      isSpeaking: foundUser.isSpeaking
    });

    return true;
  }

  /**
   * Returns a list of users which have their `isSpeaking` flag set to true.
   *
   * @returns User objects which have their `isSpeaking` flag set to true
   */
  public getSpeakingUsers(): Array<User> {
    return this.#users.filter((u) => {
      return u.isSpeaking;
    });
  }

  /**
   * Checks if the session has a master user.
   *
   * @returns True if the session has a master, false otherwise
   */
  public hasMaster(): boolean {
    return !!this.#master;
  }

  /**
   * Checks if the given user is the master of this session. If the session has
   * no master or the given user is not the master of this session, the method
   * returns false.
   *
   * @param user User to check
   * @returns True if the given user is the master of this session, false otherwise
   */
  public isMaster(user: User): boolean {
    return !!this.#master && user.id == this.#master.id;
  }

  /**
   * Adds a shared object to the session.
   *
   * @param obj Shared object to add to the session
   */
  public addObject(obj: SharedObject) {
    this.#objects.push(obj);
  }

  /**
   * Tries to find a shared object with the given ID in the session and returns
   * it. If no object with the given ID exists, undefined is returned.
   *
   * @param id ID of shared object to get
   * @returns The shared object with the given ID or undefined
   */
  public getObject(id: string): Optional<SharedObject> {
    return this.#objects.find((o) => o.id == id);
  }

  /**
   * Creates a new bubble and adds it to this session. The bubble is
   * initialised with a name and a user object who will become the owner of the
   * bubble. The method returns the newly created bubble.
   *
   * @param name Name of the bubble to be created
   * @param owner A User object representing the user creating the bubble
   * @returns The newly created bubble
   */
  public createBubble(name: string, owner: User): Bubble {
    const bubble = new Bubble(name, owner);
    this.#bubbles.push(bubble);

    this.sendSessionUpdate("BUBBLE_CREATED", bubble.serialize());

    return bubble;
  }

  /**
   * Finds a bubble with the given ID in the current session. If there is no
   * such bubble, `undefined` is returned.
   *
   * @param id ID of the bubble to find
   * @returns The bubble identified by the given ID, or undefined is there is no such bubble
   */
  public findBubble(id: string): Optional<Bubble> {
    return this.#bubbles.find((b) => b.id == id);
  }

  /**
   * Checks whether a given user is currently member of any bubble.
   *
   * @param user User to check
   * @returns True if the given user is in a bubble, false otherwise
   */
  public isInBubble(user: User): boolean {
    return this.#bubbles.find((b) => {
      return b.users.find((u) => u.id == user.id) != undefined;
    }) != undefined;
  }

  /**
   * Removes the given bubble from this session. Also clears the User.bubble
   * property of all users within the given bubble.
   *
   * @param bubbleToRemove Bubble to be removed
   */
  public removeBubble(bubbleToRemove: Bubble) {
    // Clear .bubble property of all users in bubble
    bubbleToRemove.users.forEach((u) => u.bubble = (u.bubble?.id == bubbleToRemove.id) ? undefined : u.bubble);
    // Remove bubble from session
    this.#bubbles = this.#bubbles.filter((b) => b.id != bubbleToRemove.id);
  }

  /**
   * Returns a list of currently active conversation bubbles within this
   * session.
   *
   * @returns A list of active bubbles in this session
   */
  public get bubbles(): Array<Bubble> {
    return this.#bubbles;
  }

  /**
   * Closes the current session by sending the corresponding event to all users
   * and removing the session from its transport. If the property `persistent`
   * is true, the session is not removed, unless the `override` param is set to
   * true.
   *
   * @return True if the session was removed, false otherwise
   */
  public closeSession(override = false): boolean {
    if (this.#persistent && !override) {
      return false;
    }

    this.#transport.removeSession(this);

    this.#users.forEach((u) => {
      u.socket.emit(EmittedEvents.SESSION_CLOSED, {});
    });

    return true;
  }

  /**
   * Switches the current presentation to the next one in the schedule.
   * If there is no current presentation, the first one in the schedule will
   * be selected. If there is no schedule or all presentations have been shown,
   * the method returns undefined.
   *
   * If the current presentation is changed, all users in the session
   * will be notified of the change.
   *
   * @returns The current presentation in the session, or undefined if there is
   * no schedule or all presentations have been shown.
   */
  public gotoNextPresentation(): Optional<Presentation> {
    if (this.schedule.length == 0) {
      return;
    }

    if (!this.currentPresentation) {
      this.currentPresentation = this.schedule[0];
    } else {
      const currentIndex = this.schedule.indexOf(this.currentPresentation);
      const nextPresentation = this.schedule.at(currentIndex + 1);

      this.currentPresentation = nextPresentation;
    }


    this.sendSessionUpdate("PRESENTATION_CHANGED", {
      currentPresentation: this.currentPresentation?.serialize()
    });

    return this.currentPresentation;
  }

  /**
   * Switches the current presentation to the given index in the schedule.
   * If the index if out of bounds with respect to the number of presentations
   * of the schedule, nothing happens and the method returns undefined.
   *
   * If the current presentation is changed, all users in the session
   * will be notified of the change.
   *
   * @returns The current presentation in the session, or undefined if the
   * index is out of bounds.
   */
  public setPresentation(index: number): Optional<Presentation> {
    if (this.schedule.length == 0) {
      return;
    }

    const nextPresentation = this.schedule.at(index);

    if (nextPresentation) {
      this.currentPresentation = nextPresentation;

      this.sendSessionUpdate("PRESENTATION_CHANGED", {
        currentPresentation: this.currentPresentation?.serialize()
      });

      return this.currentPresentation;
    }

    return;
  }

  /**
   * Changes the current slide of the current presentation by the given number
   * of slides. If the current presentation is not set, nothing happens.
   * If the current slide after applying the offset is smaller than zero, the
   * current slide will be set to the first slide. If the resulting slide index
   * is larger than the total number of slides, the current slide will be set
   * to the last slide.
   *
   * @param slideOffset Offset to change the current slide by. If the offset is
   * positive, the slide will be changed to the next one. If it is negative, the
   * slide will be changed to the previous one.
   */
  public changeSlide(slideOffset: number) {
    if (!this.currentPresentation) {
      return;
    }

    this.currentPresentation.currentSlide += slideOffset;

    if (this.currentPresentation.currentSlide < 0) {
      this.currentPresentation.currentSlide = 0;
    }

    if (this.currentPresentation.currentSlide >= this.currentPresentation.numSlides) {
      this.currentPresentation.currentSlide = this.currentPresentation.numSlides - 1;
    }

    this.sendSessionUpdate("SLIDE_CHANGED", {
      currentPresentation: this.currentPresentation.serialize()
    });
  }

  /**
   * Changes the current slide of the current presentation to the given index.
   * If the current presentation is not set, nothing happens. If the slide
   * index is smaller than zero, the current slide will be set to
   * the first slide. If the index is larger than the total number of slides,
   * the current slide will be set to the last slide.
   *
   * @param slideIndex Offset to change the current slide by. If the offset is
   * positive, the slide will be changed to the next one. If it is negative, the
   * slide will be changed to the previous one.
   */
  public setSlide(slideIndex: number) {
    if (!this.currentPresentation) {
      return;
    }

    this.currentPresentation.currentSlide = slideIndex;

    if (this.currentPresentation.currentSlide < 0) {
      this.currentPresentation.currentSlide = 0;
    }

    if (this.currentPresentation.currentSlide >= this.currentPresentation.numSlides) {
      this.currentPresentation.currentSlide = this.currentPresentation.numSlides - 1;
    }

    this.sendSessionUpdate("SLIDE_CHANGED", {
      currentPresentation: this.currentPresentation.serialize()
    });
  }

  public setPresentationIsSharing(isSharing: boolean): boolean {
    if (!this.currentPresentation) {
      return false;
    }

    this.currentPresentation.isSharing = isSharing;
    this.sendSessionUpdate("PRESENTATION_IS_SHARING", {
      currentPresentation: this.currentPresentation.serialize()
    });

    return true;
  }

  /**
   * Sends a given message to all users currently in the session. The message
   * can be any serialisable object.
   *
   * @param message Message to send
   */
  private notifyUsers(message: SessionEvent) {
    this.#users.forEach((u) => {
      u.socket.emit(EmittedEvents.SESSION_UPDATED, message);
    });
  }

  /**
   * Sends a session update event to all users in the session.
   *
   * @param eventId Event ID
   * @param eventData Event data
   */
  public sendSessionUpdate(eventId: SessionEventName, eventData: Dict) {
    this.notifyUsers({
      eventId, eventData
    });
  }

  /**
   * Sends a scene event from the master to all users in the session. If the
   * session has no master, this method does nothing. NB: The caller should
   * check whether the user issuing the call is the master of the session.
   *
   * @param sceneEvent Scene event to send
   */
  public sendSceneEvent(sceneEvent: any) {
    if (!this.#master) {
      return;
    }

    this.#users.forEach((user) => {
      user.sendSceneEvent(EmittedEvents.SCENE_EVENT_TO_USER, this.#master!, sceneEvent);
    });
  }

  /**
   * Sends a given message to all users currently in the session. The message
   * can be any serialisable object. The `fromUser` param will be used as the
   * sender of the message.
   *
   * @param fromUser Sender of the message
   * @param message Message to send
   */
  public sendMessageToAll(fromUser: User, message: Dict) {
    const chatMessage = new ChatMessage(fromUser, message);
    this.#chat.push(chatMessage);

    this.#users.forEach((u) => {
      u.socket.emit(EmittedEvents.MESSAGE_SENT, chatMessage.serialize());
    });
  }

  /**
   * Sends a message from a given user to another given user in the session. If
   * the recipient user is not in this session, nothing happens.
   *
   * @param fromUser Sender of the message
   * @param toUser Receiver of the message
   * @param message Message to send
   */
  public sendMessage(fromUser: User, toUser: User, message: Dict) {
    if (!this.hasUser(toUser)) {
      return;
    }

    const privateMessage = new PrivateMessage(fromUser, message);
    toUser.socket.emit(EmittedEvents.MESSAGE_SENT, privateMessage.serialize());
  }

  /**
   * Adds the given user to the list of users that raised their hand. If the
   * user is already in the list, nothing happens. The method notifies all
   * users in the session of the new raised hand.
   *
   * @param user User that raised their hand
   */
  public raiseHand(user: User) {
    if (!this.#raisedHands.includes(user)) {
      this.#raisedHands.push(user);
    }

    this.sendSessionUpdate("USER_RAISED_HAND", { userId: user.id });
  }

  /**
   * Clears the raised hand of the given user. If the user is not in the
   * raised hand list, nothing happens. The method notifies all users in the
   * session of the cleared raised hand.
   *
   * @param user User whose raised hand shall be cleared
   */
  public clearRaisedHand(user: User) {
    this.#raisedHands = this.#raisedHands.filter((u) => u.id != user.id);

    this.sendSessionUpdate("USER_CLEARED_RAISED_HAND", { userId: user.id });
  }

  /**
   * Returns the list of users that raised their hand in this session. The
   * returned list is a serialised version of the users.
   *
   * @returns An array of all users that raised their hand in this session
   */
  public getRaisedHands(): Array<Dict> {
    return this.#raisedHands.map((r) => r.serialize());
  }

  /**
   * Returns the chat messages of this session. The messages are returned in
   * reverse order, i.e. the most recent message is the first one in the array.
   * The number of messages returned is limited by the given limit. If no limit
   * is given, the default limit of 100 messages is used.
   *
   * @param limit Maximum number of messages to return
   * @returns A serialised array of chat messages
   */
  public getMessages(limit: number = 100): Array<Dict> {
    return this.#chat.reverse().slice(0, limit).map((c) => c.serialize());
  }

  /**
   * Sends raw data from the given user to all users in this session which are
   * registered for the data stream from the user with the given type.
   *
   * @param fromUser Sending user
   * @param type Type of stream
   * @param data Data to send
   */
  public sendData(fromUser: User, type: string, data: any) {
    this.#users.forEach((u) => {
      if (u.hasStreamSubscription(fromUser, type)) {
        u.socket.emit(EmittedEvents.DATA_RECEIVED, fromUser.id, type, data);
      }
    });
  }

  /**
   * Adds the given user to all channels that are defined in this session.
   * @param user The user to add to the channels
   */
  private addUserToChannels(user: User) {
    this.#channels.forEach((channel) => {
      user.socket.join(channel);
    });
  }

  /**
   * Removes the given user from all channels that are defined in this session.
   * @param user The user to remove from the channels
   */
  private removeUserFromChannels(user: User) {
    this.#channels.forEach((channel) => {
      user.socket.leave(channel);
    });
  }

  /**
   * Removes the given user from all bubbles that they might be a member of
   * @param user The user to remove from the bubbles
   */
  private removeUserFromBubbles(user: User) {
    this.#bubbles = this.#bubbles.map((b) => {
      b.removeUser(user);
      return b;
    });
  }

  /**
   * Returns the name of a given channel, scoped to this session.
   *
   * @param channel Public name of the channel
   * @returns Name of the channel that is scoped to this session
   */
  private getInternalChannelName(channel: string) {
    return `${this.#id}/${channel}`;
  }

  /**
   * Sends a broadcast containing the given piece of data to the given channel
   * originating from the given user. If the given channel does not exist on
   * the session, nothing happens.
   *
   * @param fromUser User from which the broadcast originates
   * @param channel Channel the broadcast shall be sent to
   * @param data Data that shall be sent
   */
  public broadcast(fromUser: User, channel: string, data: any) {
    const internalName = this.getInternalChannelName(channel);

    if (this.#channels.includes(internalName)) {
      fromUser.socket.to(internalName).emit(EmittedEvents.BROADCAST, channel, data);
    }
  }

  /**
   * Returns the sessions's properties as an object
   *
   * @returns Object with serialised session fields
   */
  public serialize(): Dict {
    return {
      sessionId: this.#id,
      sessionName: this.name,
      sessionDescription: this.description,
      sessionAdministrator: this.#administrator?.id,
      sessionMaster: this.#master && this.#master.id,
      sessionUsers: this.#users.map((u) => u.id),
      sessionUserDefinitions: this.#users.map((u) => u.serialize()),
      sessionObjects: this.#objects.map((o) => o.serialize()),
      sessionProtocol: this.sessionProtocol,
      sessionChannels: this.channels,
      sessionChat: this.getMessages(),
      sessionRaisedHands: this.getRaisedHands(),
      sessionCurrentPresentation: this.currentPresentation?.serialize(),
      sessionPresentations: this.schedule.map((p) => p.serialize()),
      sessionBubbles: this.#bubbles.map((b) => b.serialize()),
      sessionStatus: this.#status,
      sessionPersistent: this.#persistent,
      sessionRoom: this.#room
    };
  }
}

export default Session;

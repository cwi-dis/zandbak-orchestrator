import { v4 as uuidv4 } from "uuid";
import { Dict, Optional } from "../util";

import Serializable from "./serializable";
import User from "./user";
import Transport from "../transport/transport";
import TransportManager, { TransportType } from "../transport/transport_manager";
import Scenario from "./scenario";

class Session implements Serializable {
  #id: string = uuidv4();
  #users: Array<User> = [];
  #administrator: User;
  #master?: User;
  #transport: Transport;

  public constructor(
    public name: string,
    public description: string,
    public sessionProtocol: TransportType,
    public scenario: Scenario
  ) {
    this.#transport = TransportManager.instantiate(sessionProtocol);
  }

  public get id() {
    return this.#id;
  }

  public get tranport() {
    return this.#transport;
  }

  public get administrator() {
    return this.#administrator;
  }

  public get master() {
    return this.#master;
  }

  /**
   * Sets the given user to be the administrator of the session.
   *
   * @param user The user to be the session's administrator
   */
  public setAdministrator(user: User) {
    this.#administrator = user;
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
    this.notifyUsers({
      "eventId": "USER_JOINED_SESSION",
      "eventData": {
        "userId": user.id,
        "userData": user.serialize(),
      }
    });

    this.#users.push(user);
    this.selectMaster();
    user.session = this;
  }

  /**
   * Removes the given user to the session and notifies all currently joined
   * users of the change.
   *
   * @param user User to remove from the session
   */
  public removeUser(user: User) {
    this.#users = this.#users.filter((u) => u.id != user.id);
    this.selectMaster();
    user.session = undefined;

    this.notifyUsers({
      "eventId": "USER_LEAVED_SESSION",
      "eventData": {
        "userId": user.id,
      }
    });
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
   * Sends a given message to all users currently in the session. The message
   * can be any serialisable object.
   *
   * @param message Message to send
   */
  private notifyUsers(message: Dict) {
    this.#users.forEach((u) => {
      u.socket.emit("SessionUpdated", message);
    });
  }

  /**
   * Sends a session update event to all users in the session.
   *
   * @param eventId Event ID
   * @param eventData Event data
   */
  public sendSessionUpdate(eventId: string, eventData: Dict) {
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
      user.sendSceneEvent("SceneEventToUser", this.#master!, sceneEvent);
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
    this.#users.forEach((u) => {
      u.socket.emit("MessageSent", {
        messageFrom: fromUser.id,
        messageFromName: fromUser.name,
        message
      });
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

    toUser.socket.emit("MessageSent", {
      messageFrom: fromUser.id,
      messageFromName: fromUser.name,
      message
    });
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
      if (u.hasRemoteDataStream(fromUser, type)) {
        u.socket.emit("DataReceived", fromUser.id, type, data);
      }
    });
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
      sessionAdministrator: this.#administrator.id,
      sessionMaster: this.#master && this.#master.id,
      scenarioId: this.scenario.id,
      sessionUsers: this.#users.map((u) => u.id),
      sessionUserDefinitions: this.#users.map((u) => u.serialize()),
      sessionProtocol: this.sessionProtocol
    };
  }
}

export default Session;

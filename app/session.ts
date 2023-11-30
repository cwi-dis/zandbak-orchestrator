import { v4 as uuidv4 } from "uuid";
import { Object, Optional } from "../util";

import Serializable from "./serializable";
import User from "./user";
import Transport from "../transport/transport";
import TransportManager, { TransportType } from "../transport/transport_manager";
import Scenario from "./scenario";

class Session implements Serializable {
  #id: string = uuidv4();
  #users: Array<User> = [];
  #administrator: User;
  #master: User;
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
    user.session = this;
  }

  /**
   * Removes the given user to the session and notifies all currently joined
   * users of the change.
   *
   * @param user User to remove from the session
   */
  public removeUser(user: User) {
    this.notifyUsers({
      "eventId": "USER_LEAVED_SESSION",
      "eventData": {
        "userId": user.id,
      }
    });

    this.#users = this.#users.filter((u) => u.id != user.id);
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

  private notifyUsers(message: Object) {
    this.#users.forEach((u) => {
      u.socket.emit("SessionUpdated", message);
    });
  }

  public sendMessageToAll(fromUser: User, message: Object) {
    this.#users.forEach((u) => {
      u.socket.emit("MessageSent", {
        messageFrom: fromUser.id,
        messageFromName: fromUser.name,
        message
      });
    });
  }

  public sendMessage(fromUser: User, toUser: User, message: Object) {
    toUser.socket.emit("MessageSent", {
      messageFrom: fromUser.id,
      messageFromName: fromUser.name,
      message
    });
  }

  public serialize(): Object {
    return {
      sessionId: this.#id,
      sessionName: this.name,
      sessionDescription: this.description,
      sessionAdministrator: this.#administrator.id,
      sessionMaster: this.#master && this.#master.id,
      sessionUsers: this.#users.map((u) => u.id),
      sessionUserDefinitions: this.#users.map((u) => u.serialize()),
      sessionProtocol: this.sessionProtocol
    };
  }
}

export default Session;

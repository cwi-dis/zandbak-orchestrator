import { v4 as uuidv4 } from "uuid";
import { Object } from "../util";

import Serializable from "./serializable";
import User from "./user";

class Session implements Serializable {
  #id: string = uuidv4();
  #users: Array<User> = [];
  #administrator: User;
  #master: User;

  public constructor(
    public name: string,
    public description: string,
    public sessionProtocol: string
  ) {}

  public get id() {
    return this.#id;
  }

  public get administrator() {
    return this.#administrator;
  }

  public setAdministrator(user: User) {
    this.#administrator = user;
  }

  public addUser(user: User) {
    this.#users.push(user);
    user.session = this;
  }

  public removeUser(user: User) {
    this.notifyUsers({
      "eventId": "USER_LEAVED_SESSION",
      "eventData": {
        "userId": user.id,
        "message": "User logged out of orchestrator"
      }
    });

    this.#users = this.#users.filter((u) => u.id != user.id);
  }

  private notifyUsers(message: Object) {
    this.#users.forEach((u) => {
      u.socket.emit("SessionUpdated", message);
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

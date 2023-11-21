import { v4 as uuidv4 } from "uuid";
import User from "./user";
import { Object } from "../util";

class Session {
  #id: string = uuidv4();
  #users: Array<User> = [];
  #administrator: User;

  public constructor(
    public name: string,
    public description: string,
    public sessionProtocol: string
  ) {}

  public get id() {
    return this.#id;
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
}

export default Session;

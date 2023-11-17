import uuid from "uuid";
import io from "socket.io";
import Session from "./session";

class User {
  #id: string = uuid.v4();
  #loggedIn: boolean = false;

  public session: Session;

  public constructor(public name: string, public socket: io.Socket) {}

  public get id() {
    return this.#id;
  }

  public get loggedIn() {
    return this.#loggedIn;
  }

  public logout() {
    this.session.removeUser(this);
  }
}

export default User;

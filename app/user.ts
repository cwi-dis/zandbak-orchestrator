import { v4 as uuidv4 } from "uuid";
import io from "socket.io";
import Session from "./session";
import Serializable from "./serializable";
import { Object } from "../util";

class User implements Serializable {
  #id: string = uuidv4();
  #loggedIn: boolean = false;
  #userData: Object;

  public session?: Session;

  public constructor(public name: string, public socket: io.Socket, userData: Object = {}) {
    this.#userData = userData;
  }

  public get id() {
    return this.#id;
  }

  public get loggedIn() {
    return this.#loggedIn;
  }

  public get userData() {
    return this.#userData;
  }

  /**
   * Remove user from their current session. If the user is not part of any
   * session, this method does nothing.
   */
  public logout() {
    this.session?.removeUser(this);
  }

  /**
   * Returns the user's properties as an object
   *
   * @returns Object with serialised user fields
   */
  public serialize(): Object {
    return {
      userId: this.#id,
      userName: this.name,
      userData: this.#userData,
    };
  }
}

export default User;

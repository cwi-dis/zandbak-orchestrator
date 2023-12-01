import { v4 as uuidv4 } from "uuid";
import io from "socket.io";
import Session from "./session";
import Serializable from "./serializable";
import { Object } from "../util";

class User implements Serializable {
  #id: string = uuidv4();
  #loggedIn: boolean = false;
  #userData: Map<string, any>;

  public session?: Session;

  public constructor(public name: string, public socket: io.Socket, userData: Object = {}) {
    this.#userData = new Map(Object.entries(userData));
  }

  public get id() {
    return this.#id;
  }

  public get loggedIn() {
    return this.#loggedIn;
  }

  public get userData() {
    return Object.fromEntries(this.#userData);
  }

  /**
   * Updates the `userData` property of this user object by overriding all
   * key-value pairs with values found in the passed object. Values not
   * specified in the passed object retain their original value. The passed
   * object can either be a JSON-formatted string or a JS object.
   *
   * @param userData JSON-string or JS object
   * @returns The updated user data object
   */
  public updateUserData(userData: string | Object): Object {
    const obj = (typeof userData == "string") ? JSON.parse(userData) : userData;

    this.#userData = new Map(Object.entries({
      ...this.userData,
      ...obj
    }));

    return this.userData;
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

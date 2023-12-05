import { v4 as uuidv4 } from "uuid";
import io from "socket.io";
import Session from "./session";
import Serializable from "./serializable";
import { Object } from "../util";
import DataStream from "./data_stream";

class User implements Serializable {
  #id: string = uuidv4();
  #loggedIn: boolean = false;
  #userData: Map<string, any>;
  #dataStreams: Map<string, DataStream>;

  public session?: Session;

  public constructor(public name: string, public socket: io.Socket, userData: Object = {}) {
    this.#userData = new Map(Object.entries(userData));
    this.#dataStreams = new Map();
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
   * Sends a scene event to this user.
   *
   * @param eventId ID of the scene event
   * @param fromUser Sender of the scene event
   * @param sceneEventData Data associated to the event
   */
  public sendSceneEvent(eventId: "SceneEventToMaster" | "SceneEventToUser", fromUser: User, sceneEventData: any) {
    this.socket.emit(eventId, {
      sceneEventFrom: fromUser.id,
      sceneEventData
    });
  }

  /**
   * Adds a new data stream with the given type and description to this user.
   *
   * @param type Type of stream to add
   * @param description Stream description
   */
  public declareDataStream(type: string, description: string) {
    this.#dataStreams.set(type, new DataStream(type, description));
  }

  /**
   * Returns a data stream of the given type. If no such stream exists, null is
   * returned.
   *
   * @param type Type of data stream to get
   * @returns A data stream of the given type, null otherwise
   */
  public getDataStream(type: string) {
    return this.#dataStreams.get(type) || null;
  }

  /**
   * Removes a data stream of the given type from this user. If the user has no
   * such data stream, nothing happens.
   *
   * @param type Type of stream to remove
   */
  public removeDataStream(type: string) {
    this.#dataStreams.delete(type);
  }

  /**
   * Removes all data streams from this user.
   *
   * @param type Type of stream to remove
   */
  public removeAllDataStreams() {
    this.#dataStreams.clear();
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

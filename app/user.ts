import { v4 as uuidv4 } from "uuid";
import io from "socket.io";

import Session from "./session";
import Serializable from "./serializable";
import { mapHashToDict, Dict } from "../util";
import DataStream from "./data_stream";
import StreamSubscription from "./stream_subscription";
import EmittedEvents from "./emitted_events";

class User implements Serializable {
  #id: string = uuidv4();
  #loggedIn: boolean = false;
  #canBeMaster: boolean = true;
  #userData: Map<string, any>;

  #dataStreams: Map<string, DataStream>;
  #streamSubscriptions: Map<string, StreamSubscription>;

  public session?: Session;

  public constructor(public name: string, public socket: io.Socket, userData: Dict = {}) {
    this.#userData = new Map(Object.entries(userData));

    this.#dataStreams = new Map();
    this.#streamSubscriptions = new Map();
  }

  public get id() {
    return this.#id;
  }

  public get loggedIn() {
    return this.#loggedIn;
  }

  public get canBeMaster() {
    return this.#canBeMaster;
  }

  public get userData() {
    return Object.fromEntries(this.#userData);
  }

  public get dataStreams() {
    return mapHashToDict(this.#dataStreams, ([type, stream]) => {
      return [type, stream.serialize()];
    });
  }

  public get remoteDataStreams() {
    return mapHashToDict(this.#streamSubscriptions, ([type, stream]) => {
      return [type, stream.serialize()];
    });
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
  public updateUserData(userData: string | Dict): Dict {
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
    this.session = undefined;
  }

  /**
   * Sends a scene event to this user.
   *
   * @param eventId ID of the scene event
   * @param fromUser Sender of the scene event
   * @param sceneEventData Data associated with the event
   */
  public sendSceneEvent(eventId: EmittedEvents.SCENE_EVENT_TO_MASTER | EmittedEvents.SCENE_EVENT_TO_USER, fromUser: User, sceneEventData: any) {
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
   * Adds a new stream subscription for the given user with the given type and
   * description to this user.
   *
   * @param user User for stream
   * @param type Type of stream to add
   */
  public subscribeToDataStream(user: User, type: string) {
    const remoteStream = new StreamSubscription(user, type);
    this.#streamSubscriptions.set(remoteStream.id, remoteStream);
  }

  /**
   * Returns a stream subscription of the given type for the given user. If no
   * such stream subscription exists, null is returned.
   *
   * @param user User for stream
   * @param type Type of data stream to get
   * @returns A data stream of the given type, null otherwise
   */
  public getStreamSubscription(user: User, type: string) {
    return this.#streamSubscriptions.get(
      StreamSubscription.genId(user.id, type)
    ) || null;
  }

  /**
   * Removes a data stream subscription for the given user of the given type
   * from this user. If the user has no such stream subscription, nothing
   * happens.
   *
   * @param user User for stream
   * @param type Type of stream to remove
   */
  public removeStreamSubscription(user: User, type: string) {
    this.#streamSubscriptions.delete(StreamSubscription.genId(user.id, type));
  }

  /**
   * Removes all streams subscriptions from this user.
   *
   * @param type Type of stream to remove
   */
  public removeAllStreamSubscriptions() {
    this.#streamSubscriptions.clear();
  }

  /**
   * Checks if this user object has a stream subscription for the given user
   * and stream type.
   *
   * @param user User for remote data stream
   * @param type Type of stream
   * @returns True if this user has a remote data stream with the given parameters
   */
  public hasStreamSubscription(user: User, type: string): boolean {
    return this.#streamSubscriptions.has(StreamSubscription.genId(user.id, type));
  }

  /**
   * Returns the user's properties as an object
   *
   * @returns Object with serialised user fields
   */
  public serialize(): Dict {
    return {
      userId: this.#id,
      userName: this.name,
      userData: Object.fromEntries(this.#userData),
      sfuData: { url_gen: "", audio_gen: "", pcc_gen: "" },
    };
  }
}

export default User;

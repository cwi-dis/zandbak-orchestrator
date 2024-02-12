import { v4 as uuidv4 } from "uuid";

import Session from "./session";
import User from "./user";
import { Optional, Dict } from "../util";

class Orchestrator {
  public id: string = uuidv4();

  #sessions: Array<Session> = [];
  #users: Array<User> = [];

  /**
   * Adds a new user to the orchestrator.
   *
   * If the given user is already added to the orchestrator instance, this
   * method does nothing.
   *
   * @param user User object to add to orchestrator
   */
  public addUser(user: User) {
    const alreadyPresent = !!this.#users.find((u) => u.id == user.id);

    if (!alreadyPresent) {
      this.#users.push(user);
    }
  }

  /**
   * Return a User object for the user identified by the given ID.
   *
   * @param id ID of the user to retrieve
   * @returns A User object with the given ID, undefined if there is no User with this ID
   */
  public getUser(id: string): Optional<User> {
    return this.#users.find((u) => u.id == id);
  }

  /**
   * Return a User object with the given name.
   *
   * @param id Name of the user to retrieve
   * @returns A User object with the given name, undefined if there is no User with the name
   */
  public findUser(name: string): Optional<User> {
    return this.#users.find((u) => u.name == name);
  }

  /**
   * Removes a given user from the orchestrator.
   *
   * @param user User to remove from the orchestrator
   */
  public removeUser(user: User) {
    this.#users = this.#users.filter((u) => u.id != user.id);
  }

  /**
   * Returns the session identified by the given ID or undefined if no such
   * session exists.
   *
   * @param id ID of session to retrieve
   * @returns The session identified by the given ID, undefined if no such session
   */
  public getSession(id: string): Optional<Session> {
    return this.#sessions.find((s) => s.id == id);
  }

  /**
   * Adds a session to the orchestrator.
   *
   * @param session Session to add
   */
  public addSession(session: Session) {
    this.#sessions.push(session);
  }

  /**
   * Removes a given session from the orchestrator.
   *
   * @param session Session to remove
   */
  public removeSession(session: Session) {
    session.closeSession();
    this.#sessions = this.#sessions.filter((s) => s.id != session.id);
  }


  /**
   * Returns all sessions of which the given user is an admin of.
   *
   * @param user User which should be admin of the returned sessions
   * @returns Sessions which the given user is an admin of
   */
  public getAdministratedSessions(user: User): Array<Session> {
    return this.#sessions.filter((s) => s.administrator.id == user.id);
  }

  /**
   * Returns an object of serialised sessions indexed by their session IDs.
   */
  public get sessions() {
    return this.#sessions.reduce<{[key: string]: Dict}>((acc, s) => {
      return {
        ...acc,
        [s.id]: s.serialize()
      };
    }, {});
  }
}

export default Orchestrator;

import { v4 as uuidv4 } from "uuid";

import Session from "./session";
import User from "./user";
import { Optional } from "../util";

class Orchestrator {
  public id: string = uuidv4();

  #sessions: Array<Session> = [];
  #users: Array<User> = [];

  public constructor() {}

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

  public removeUser(user: User) {
    this.#users = this.#users.filter((u) => u.id != user.id);
  }

  public getSession(id: string): Optional<Session> {
    return this.#sessions.find((s) => s.id == id);
  }

  public addSession(session: Session) {
    this.#sessions.push(session);
  }

  public removeSession(session: Session) {
    this.#sessions = this.#sessions.filter((s) => s.id != session.id);
  }

  public get sessions() {
    return this.#sessions.reduce((acc, s) => {
      return {
        ...acc,
        [s.id]: s.serialize()
      };
    }, {});
  }
}

export default Orchestrator;

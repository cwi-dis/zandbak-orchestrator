import uuid from "uuid";

import Session from "./session";
import User from "./user";
import { Optional } from "../util";

class Orchestrator {
  public id: string = uuid.v4();

  private sessions: Array<Session> = [];
  private users: Array<User> = [];

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
    const alreadyPresent = !!this.users.find((u) => u.id == user.id);

    if (!alreadyPresent) {
      this.users.push(user);
    }
  }

  /**
   * Return a User object for the user identified by the given ID.
   *
   * @param id ID of the user to retrieve
   * @returns A User object with the given ID, undefined if there is no User with this ID
   */
  public getUser(id: string): Optional<User> {
    return this.users.find((u) => u.id == id);
  }

  /**
   * Return a User object with the given name.
   *
   * @param id Name of the user to retrieve
   * @returns A User object with the given name, undefined if there is no User with the name
   */
  public findUser(name: string): Optional<User> {
    return this.users.find((u) => u.name == name);
  }

  public removeUser(user: User) {
    this.users = this.users.filter((u) => u.id != user.id);
  }
}

export default Orchestrator;

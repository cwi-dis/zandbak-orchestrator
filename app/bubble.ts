import { v4 as uuidv4 } from "uuid";

import Serializable from "./serializable";
import User from "./user";
import { Dict } from "../util";

class Bubble extends Serializable {
  #id: string = uuidv4();
  #name: string;
  #owner: User;
  #users: Array<User> = [];

  public constructor(name: string, owner: User) {
    super();

    this.#name = name;
    this.#owner = owner;
    this.#users.push(owner);
  }

  public get id(): string {
    return this.#id;
  }

  public get name(): string {
    return this.#name;
  }

  public get owner(): User {
    return this.#owner;
  }

  public get users(): Array<User> {
    return this.#users;
  }

  /**
   * Removes the given user from the bubble if it is a member of it. If the
   * given user is not in this bubble, nothing happens and the method returns
   * false.
   *
   * @param user User to remove
   * @returns True if the user was removed from the bubble, false otherwise
   */
  public removeUser(user: User): boolean {
    const filteredUsers = this.#users.filter((u) => u.id != user.id);

    if (filteredUsers.length == this.#users.length) {
      return false;
    }

    this.#users = filteredUsers;
    return true;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      name: this.#name,
      owner: this.#owner,
      users: this.#users.map((u) => u.serialize())
    };
  }
}

export default Bubble;

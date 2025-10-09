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
   * Checks whether the given user is a member of this bubble.
   * The check is performed by comparing user IDs.
   *
   * @param user The user to check
   * @returns True if the given user is in the bubble, false otherwise
   */
  public isInBubble(user: User): boolean {
    return this.#users.find((u) => u.id == user.id) != undefined;
  }

  /**
   * Adds the given user to this bubble.
   * Returns true if the user was successfully added to the bubble. If the
   * given user is already a member of this bubble, nothings happens and the
   * method returns false.
   *
   * @param user User to add to this bubble
   * @returns True if the user was added successfully, false otherwise
   */
  public addUser(user: User): boolean {
    if (this.isInBubble(user)) {
      return false;
    }

    this.#users.push(user);
    return true;
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
      owner: this.#owner.serialize(),
      users: this.#users.map((u) => u.serialize())
    };
  }
}

export default Bubble;

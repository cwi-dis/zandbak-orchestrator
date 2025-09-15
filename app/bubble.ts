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

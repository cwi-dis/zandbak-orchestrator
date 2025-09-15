import Serializable from "./serializable";
import User from "./user";
import { Dict } from "../util";

class Bubble extends Serializable {
  #name: string;
  #owner: User;
  #users: Array<User> = [];

  public constructor(name: string, owner: User) {
    super();

    this.#name = name;
    this.#owner = owner;
    this.#users.push(owner);
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
      name: this.#name,
      owner: this.#owner,
      users: this.#users.map((u) => u.serialize())
    };
  }
}

export default Bubble;

import Serializable from "./serializable";
import User from "./user";
import { Dict } from "../util";

class Bubble extends Serializable {
  #users: Array<User> = [];

  public serialize(): Dict {
    return {
      users: this.#users.map((u) => u.serialize())
    };
  }
}

export default Bubble;

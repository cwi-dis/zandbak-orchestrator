import Serializable from "./serializable";
import User from "./user";
import { Dict } from "../util";

class Trigger extends Serializable {
  #id: string;

  public constructor(id: string, public owner: User, public value?: Dict) {
    super();
    this.#id = id;
  }

  public get id() {
    return this.#id;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      owner: this.owner.serialize(),
      value: this.value
    };
  }
}

export default Trigger;

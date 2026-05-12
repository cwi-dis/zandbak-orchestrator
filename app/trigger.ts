import { v4 as uuidv4 } from "uuid";

import Serializable from "./serializable";
import User from "./user";
import { Dict } from "../util";

class Trigger extends Serializable {
  #id: string = uuidv4();

  public constructor(public owner: User, public value?: Dict) {
    super();
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

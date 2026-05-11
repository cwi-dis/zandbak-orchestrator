import { v4 as uuidv4 } from "uuid";

import Serializable from "./serializable";
import User from "./user";
import { Dict, ObjectTransform } from "../util";

class SharedObject extends Serializable {
  #id: string = uuidv4();

  public constructor(public owner: User, public transform?: ObjectTransform) {
    super();
  }

  public get id() {
    return this.#id;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      owner: this.owner.serialize(),
      transform: this.transform
    };
  }
}

export default SharedObject;

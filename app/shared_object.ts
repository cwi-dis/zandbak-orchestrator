import { v4 as uuidv4 } from "uuid";

import Serializable from "./serializable";
import User from "./user";
import { Dict, UserTransform } from "../util";


class SharedObject extends Serializable {
  #id: string = uuidv4();

  public transform?: UserTransform;

  public constructor(public owner: User) {
    super();
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

import Serializable from "./serializable";
import User from "./user";
import { Dict, Transform, ObjectTransform } from "../util";

class SharedObject extends Serializable {
  #id: string;

  public transform?: ObjectTransform;

  public constructor(id: string, public owner: User, public initialTransform?: Transform) {
    super();
    this.#id = id;

    if (initialTransform) {
      this.transform = {
        ...initialTransform, id
      };
    }
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

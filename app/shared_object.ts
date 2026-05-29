import Serializable from "./serializable";
import User from "./user";
import { Dict, Transform, ObjectTransform } from "../util";

class SharedObject extends Serializable {
  #id: string;
  #dynamic: boolean = false;

  public transform?: ObjectTransform;

  public constructor(id: string, public owner: User, public initialTransform?: Transform, public prefabName?: string) {
    super();
    this.#id = id;

    // If prefabName is given, it is a dynamically spawned object
    if (prefabName) {
      this.#dynamic = true;
    }

    if (initialTransform) {
      this.transform = {
        ...initialTransform, id
      };
    }
  }

  public get id() {
    return this.#id;
  }

  public get dynamic() {
    return this.#dynamic;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      owner: this.owner.serialize(),
      transform: this.transform,
      prefabName: this.prefabName,
      dynamic: this.#dynamic
    };
  }
}

export default SharedObject;

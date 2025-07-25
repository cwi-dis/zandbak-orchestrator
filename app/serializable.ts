import { Dict } from "../util";

abstract class Serializable {
  abstract serialize(): Dict;

  public toJSON(): Dict {
    return this.serialize();
  }
}

export default Serializable;

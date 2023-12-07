import { Dict } from "../util";

interface Serializable {
  serialize(): Dict;
}

export default Serializable;

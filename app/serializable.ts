import { Object } from "../util";

interface Serializable {
  serialize(): Object;
}

export default Serializable;

import Serializable from "./serializable";
import { Dict } from "../util";

class DataStream extends Serializable {
  public constructor(public type: string, public description: string) {
    super();
  }

  public get id() {
    return this.type;
  }

  public serialize(): Dict {
    return {
      dataStreamKind: this.type,
      dataSteamDescription: this.description
    };
  }
}

export default DataStream;

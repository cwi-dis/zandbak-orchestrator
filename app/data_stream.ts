import Serializable from "./serializable";
import { Dict } from "../util";

class DataStream implements Serializable {
  constructor(public type: string, public description: string) {
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

import { Dict } from "../util";
import Transport from "./transport";
import Serializable from "app/serializable";

class ExternalTransport implements Transport, Serializable {
  public start(): void {
  }

  public destroy(): void {
  }

  public getUrls(): Dict {
    return {
      url_gen: "",
      audio_gen: "",
      pcc_gen: ""
    };
  }

  public serialize(): Dict {
    return {};
  }
}

export default ExternalTransport;

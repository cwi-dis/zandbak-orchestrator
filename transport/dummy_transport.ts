import { Dict } from "../util";
import Transport, { TransportUrls } from "./transport";
import Serializable from "app/serializable";

class DummyTransport implements Transport, Serializable {
  public start(): void {
  }

  public destroy(): void {
  }

  public getUrls(): TransportUrls {
    return {
      url_gen: "",
      url_audio: "",
      url_pcc: ""
    };
  }

  public addSession() {
  }

  public removeSession() {
  }

  public countSessions(): number {
    return 0;
  }

  public serialize(): Dict {
    return {};
  }
}

export default DummyTransport;

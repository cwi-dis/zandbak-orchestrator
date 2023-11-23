import { Object } from "../util";
import Transport from "./transport";

class SocketioTransport implements Transport {
  public start(): void {
  }

  public destroy(): void {
  }

  public getUrls(): Object {
    return {};
  }
}

export default SocketioTransport;

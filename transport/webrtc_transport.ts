import { Object } from "../util";
import Transport from "./transport";

class WebRTCTransport implements Transport {
  public start(): void {
  }

  public destroy(): void {
  }

  public getUrls(): Object {
    return {};
  }
}

export default WebRTCTransport;

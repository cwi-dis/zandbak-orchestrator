import { getFromEnvironment } from "../util";

import Transport from "./transport";
import DashTransport from "./dash_transport";
import WebRTCTransport from "./webrtc_transport";
import DummyTransport from "./dummy_transport";

export type TransportType = "dash" | "webrtc" | "socketio" | "unknown";

const [ EXTERNAL_HOSTNAME ] = getFromEnvironment(["EXTERNAL_HOSTNAME"], null);

class TransportManager {
  public static instantiate(protocol: TransportType): Transport {
    switch (protocol) {
    case "webrtc":
      return new WebRTCTransport(EXTERNAL_HOSTNAME);
    case "dash":
      return new DashTransport(EXTERNAL_HOSTNAME);
    case "unknown":
    default:
      return new DummyTransport();
    }
  }
}

export default TransportManager;

import { getFromEnvironment } from "../../util";

import Transport from "../transport";
import DashTransport from "../dash_transport";
import WebRTCTransport from "../webrtc_transport";
import DummyTransport from "../dummy_transport";
import ExternalTransport from "../external_transport";

export type ExternalTransportType = "dash" | "webrtc";
export type TransportType = ExternalTransportType | "socketio" | "unknown";

const [ EXTERNAL_HOSTNAME ] = getFromEnvironment(["EXTERNAL_HOSTNAME"], null);

class TransportManager {
  public assignTransportManger(protocol: TransportType): Transport {
    switch (protocol) {
    case "webrtc":
      return this.assignWebRTCTransportManager();
    case "dash":
      return this.assignDashTransportManager();
    case "unknown":
    default:
      return new DummyTransport();
    }
  }

  private assignWebRTCTransportManager(): ExternalTransport {
    return new WebRTCTransport(EXTERNAL_HOSTNAME);
  }

  private assignDashTransportManager(): ExternalTransport {
    return new DashTransport(EXTERNAL_HOSTNAME);
  }
}

export default TransportManager;

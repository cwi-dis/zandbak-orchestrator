import DashTransport from "./dash_transport";
import WebRTCTransport from "./webrtc_transport";
import DummyTransport from "./dummy_transport";

export type TransportType = "dash" | "webrtc" | "socketio" | "unknown";

class TransportManager {
  public static instantiate(protocol: TransportType) {
    switch (protocol) {
    case "webrtc":
      return new WebRTCTransport();
    case "dash":
      return new DashTransport();
    case "unknown":
    default:
      return new DummyTransport();
    }
  }
}

export default TransportManager;

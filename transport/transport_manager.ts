import DashTransport from "./dash_transport";
import SocketioTransport from "./socketio_transport";
import WebRTCTransport from "./webrtc_transport";

export type TransportType = "dash" | "webrtc" | "socketio" | "unknown";

class TransportManager {
  public static instantiate(protocol: TransportType) {
    switch (protocol) {
    case "dash":
      return new DashTransport();
    case "webrtc":
      return new WebRTCTransport();
    case "socketio":
    case "unknown":
    default:
      return new SocketioTransport();
    }
  }
}

export default TransportManager;

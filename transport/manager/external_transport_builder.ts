import DashTransport from "../dash_transport";
import WebRTCTransport from "../webrtc_transport";
import ExternalTransport from "../external_transport";
import { ExternalTransportType } from "./transport_manager";
import Session from "../../app/session";
import { TransportConfig } from "../transport";

class ExternalTransportBuilder {
  private constructor() {
  }

  public static instantiate(protocol: ExternalTransportType, externalHostname: string, port: number, transportConfig: TransportConfig, session: Session): ExternalTransport {
    const transport = (protocol == "webrtc") ? (
      new WebRTCTransport(externalHostname, transportConfig, port)
    ) : (
      new DashTransport(externalHostname, transportConfig, port)
    );

    transport.addSession(session);
    return transport;
  }
}

export default ExternalTransportBuilder;

import DashTransport from "../dash_transport";
import WebRTCTransport from "../webrtc_transport";
import ExternalTransport from "../external_transport";
import { ExternalTransportType } from "./transport_manager";
import Session from "../../app/session";
import { TransportConfig } from "../transport";

class ExternalTransportBuilder {
  private constructor() {
  }

  /**
   * Instantiates a child of `ExternalTransport`, depending on the value of
   * `protocol` and returns it.
   *
   * @param protocol Transport protocol, `dash` or `webrtc`
   * @param externalHostname Hostname through which transport is available
   * @param port Port on which transport is available
   * @param transportConfig Transport config
   * @param session Session to add to transport
   * @returns An instance of a child of ExternalTransport, depending on `protocol`
   */
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

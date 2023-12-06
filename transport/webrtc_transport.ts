import ExternalTransport from "./external_transport";

class WebRTCTransport extends ExternalTransport {
  protected cmdLine: Array<string>;
  protected port: number;
  protected tls: boolean;
}

export default WebRTCTransport;

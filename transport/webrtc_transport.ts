import ExternalTransport from "./external_transport";

interface WebRTCTransportPortMapping {
  port: number;
  sfuData: {
    url_gen: string,
    url_audio: string,
    url_pcc: string
  }
}

interface WebRTCTransportConfig {
  tls: boolean;
  autorestart: boolean;
  log: boolean;
  logPrefix: string;
  logSuffix: string;
  commandLine: Array<string>
  portMapping: Array<WebRTCTransportPortMapping>
}

class WebRTCTransport extends ExternalTransport {
  protected cmdLine: Array<string>;
  protected port: number;
  protected tls: boolean;
}

export default WebRTCTransport;

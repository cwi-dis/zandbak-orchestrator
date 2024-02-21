import { loadConfigSync } from "../util";
import ExternalTransport from "./external_transport";
import { TransportUrls } from "./transport";

interface WebRTCTransportPortMapping {
  port: number;
  sfuData: TransportUrls;
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
  private transportConfig: WebRTCTransportConfig = loadConfigSync("config/webrtc-config.json");

  protected type = "WebRTC";
  protected cmdLine: Array<string> = this.transportConfig.commandLine;
  protected tls: boolean = this.transportConfig.tls;
  protected port: number;
}

export default WebRTCTransport;

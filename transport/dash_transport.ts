import ExternalTransport from "./external_transport";

interface DashTransportPortMapping {
  port: number;
  sfuData: {
    url_gen: string,
    url_audio: string,
    url_pcc: string
  }
}

interface DashTransportConfig {
  tls: boolean;
  autorestart: boolean;
  log: boolean;
  logPrefix: string;
  logSuffix: string;
  commandLine: Array<string>
  portMapping: Array<DashTransportPortMapping>
}

class DashTransport extends ExternalTransport {
  protected cmdLine: Array<string>;
  protected port: number;
  protected tls: boolean;
}

export default DashTransport;

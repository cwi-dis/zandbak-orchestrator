import { loadConfigSync } from "../util";
import ExternalTransport from "./external_transport";
import { TransportUrls } from "./transport";
import User from "../app/user";

interface DashTransportPortMapping {
  port: number;
  sfuData: TransportUrls;
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
  private transportConfig: DashTransportConfig = loadConfigSync("config/sfu-config.json");

  protected type = "Dash";
  protected cmdLine: Array<string> = this.transportConfig.commandLine;
  protected tls: boolean = this.transportConfig.tls;
  protected port: number;
}

export default DashTransport;

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

  private buildUrl(urlTemplate: string, user: User) {
    return urlTemplate.replace(
      "%EXTERNAL_HOSTNAME%", this.externalHostname
    ).replace(
      "%SESSION_ID%", user.session?.id || ""
    ).replace(
      "%USER_ID%", user.id
    );
  }

  public getUrls(user: User) {
    const sfuUrls = this.transportConfig.portMapping[this.port].sfuData;

    return {
      url_gen: this.buildUrl(sfuUrls.url_gen, user),
      url_audio: this.buildUrl(sfuUrls.url_audio, user),
      url_pcc: this.buildUrl(sfuUrls.url_pcc, user)
    };
  }
}

export default DashTransport;

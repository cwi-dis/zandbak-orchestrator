import ExternalTransport from "./external_transport";
import User from "../app/user";

class DashTransport extends ExternalTransport {
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

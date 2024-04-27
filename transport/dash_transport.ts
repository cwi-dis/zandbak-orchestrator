import ExternalTransport from "./external_transport";
import User from "../app/user";

class DashTransport extends ExternalTransport {
  protected type = "Dash";
  protected cmdLine: Array<string> = this.transportConfig.commandLine;
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
    const portMapping = this.transportConfig.portMapping.find((p) => p.port == this.port);

    if (portMapping) {
      const { sfuData } = portMapping;

      return {
        url_gen: this.buildUrl(sfuData.url_gen, user),
        url_audio: this.buildUrl(sfuData.url_audio, user),
        url_pcc: this.buildUrl(sfuData.url_pcc, user)
      };
    }

    return {
      url_gen: "",
      url_audio: "",
      url_pcc: "",
    };
  }
}

export default DashTransport;

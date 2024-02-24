import ExternalTransport from "./external_transport";

class WebRTCTransport extends ExternalTransport {
  protected type = "WebRTC";
  protected cmdLine: Array<string> = this.transportConfig.commandLine;
  protected tls: boolean = this.transportConfig.tls;
  protected port: number;

  private buildUrl(urlTemplate: string) {
    return urlTemplate.replace(
      "%EXTERNAL_HOSTNAME%", this.externalHostname
    );
  }

  public getUrls() {
    const sfuUrls = this.transportConfig.portMapping[this.port].sfuData;

    return {
      url_gen: this.buildUrl(sfuUrls.url_gen),
      url_audio: this.buildUrl(sfuUrls.url_audio),
      url_pcc: this.buildUrl(sfuUrls.url_pcc),
    };
  }
}

export default WebRTCTransport;

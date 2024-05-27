import ExternalTransport from "./external_transport";

class TCPReflectorTransport extends ExternalTransport {
  protected type = "TCPReflector";
  protected cmdLine: Array<string> = this.transportConfig.commandLine;
  protected port: number;

  private buildUrl(urlTemplate: string) {
    return urlTemplate.replace(
      "%EXTERNAL_HOSTNAME%", this.externalHostname
    );
  }

  public getUrls() {
    const portMapping = this.transportConfig.portMapping.find((p) => p.port == this.port);

    if (portMapping) {
      const { sfuData } = portMapping;

      return {
        url_gen: this.buildUrl(sfuData.url_gen),
        url_audio: this.buildUrl(sfuData.url_audio),
        url_pcc: this.buildUrl(sfuData.url_pcc),
      };
    }

    return {
      url_gen: "",
      url_audio: "",
      url_pcc: "",
    };
  }
}

export default TCPReflectorTransport;

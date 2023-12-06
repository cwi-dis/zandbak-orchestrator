import ExternalTransport from "./external_transport";

class DashTransport extends ExternalTransport {
  protected cmdLine: Array<string>;
  protected port: number;
  protected tls: boolean;
}

export default DashTransport;

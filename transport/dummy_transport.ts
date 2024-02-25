import Transport, { TransportUrls } from "./transport";

class DummyTransport implements Transport {
  public start() {}
  public destroy() {}
  public addSession() {}
  public removeSession() {}

  public countSessions(): number {
    return 0;
  }

  public getUrls(): TransportUrls {
    return {
      url_gen: "",
      url_audio: "",
      url_pcc: ""
    };
  }
}

export default DummyTransport;

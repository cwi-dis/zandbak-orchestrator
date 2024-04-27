import Session from "../app/session";
import User from "../app/user";

interface TransportPortMapping {
  port: number;
  sfuData: TransportUrls;
}

export interface TransportConfig {
  commandLine: Array<string>
  portMapping: Array<TransportPortMapping>
}

export interface TransportUrls {
  url_gen: string;
  url_audio: string;
  url_pcc: string;
}

interface Transport {
  start(): void;
  destroy(): void;
  getUrls(user: User): TransportUrls;

  addSession(session: Session): void;
  removeSession(session: Session): void;
  countSessions(): number;
}

export default Transport;

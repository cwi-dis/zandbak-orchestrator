import User from "../app/user";

export interface TransportUrls {
  url_gen: string;
  url_audio: string;
  url_pcc: string;
}

interface Transport {
  start(): void;
  destroy(): void;
  getUrls(user: User): TransportUrls;
  countSessions(): number;
}

export default Transport;

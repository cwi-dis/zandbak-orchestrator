import User from "../app/user";

interface WebRTCTransportPortMapping {
  port: number;
  sfuData: TransportUrls;
}

export interface TransportConfig {
  tls: boolean;
  autorestart: boolean;
  log: boolean;
  logPrefix: string;
  logSuffix: string;
  commandLine: Array<string>
  portMapping: Array<WebRTCTransportPortMapping>
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
  countSessions(): number;
}

export default Transport;

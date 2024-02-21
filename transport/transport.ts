export interface TransportUrls {
  url_gen: string;
  url_audio: string;
  url_pcc: string;
}

interface Transport {
  start(): void;
  destroy(): void;
  getUrls(): TransportUrls;
}

export default Transport;

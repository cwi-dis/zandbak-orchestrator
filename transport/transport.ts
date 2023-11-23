import { Object } from "../util";

interface Transport {
  start(): void;
  destroy(): void;
  getUrls(): Object;
}

export default Transport;

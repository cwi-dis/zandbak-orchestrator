import { Dict } from "../util";

interface Transport {
  start(): void;
  destroy(): void;
  getUrls(): Dict;
}

export default Transport;

import User from "../user";
import VirtualSocket from "./virtual_socket";
import PluginAPI from "./plugin_api";

class PluginUser extends User {
  public readonly api: PluginAPI;

  constructor(name: string) {
    // Pass a VirtualSocket as the socket to the User constructor
    // We cast to any because VirtualSocket doesn't implement all of io.Socket
    super(name, new VirtualSocket() as any, "headless");
    this.api = new PluginAPI(this);
  }

  public get virtualSocket(): VirtualSocket {
    return this.socket as unknown as VirtualSocket;
  }
}

export default PluginUser;

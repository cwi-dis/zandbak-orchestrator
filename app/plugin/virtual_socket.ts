import { EventEmitter } from "events";

class VirtualSocket extends EventEmitter {
  public id: string = "virtual-socket";

  public join(room: string | string[]): this {
    return this;
  }

  public leave(room: string): this {
    return this;
  }

  public to(room: string): this {
    return this;
  }

  // socket.io uses 'emit' to send messages to the client.
  // In our case, 'emit' will be used by plugins to trigger handlers on this socket.
  // We don't need to override 'emit' because EventEmitter.emit already triggers 'on' listeners.
}

export default VirtualSocket;

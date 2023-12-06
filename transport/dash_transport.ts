import childProcess from "child_process";
import { v4 as uuidv4 } from "uuid";

import { Object } from "../util";
import Transport from "./transport";
import Serializable from "app/serializable";

class DashTransport implements Transport, Serializable {
  private id = uuidv4();
  private process?: childProcess.ChildProcessWithoutNullStreams;

  private cmdLine: Array<string>;
  private port: number;
  private tls: boolean;

  /**
   * Starts a new DASH SFU process if one is not already running.
   */
  public start(): void {
    if (this.process) {
      return;
    }

    if(!this.cmdLine || this.cmdLine.length < 1){
      return;
    }

    const command = this.cmdLine[0];
    const params = this.cmdLine.slice(1).map((param) => {
      return param.replace("%SFU_PORT%", this.port.toString());
    });

    this.process = childProcess.spawn(
      command,
      params,
      { detached: true }
    );

    this.process.stdout.on("data", () => {});
    this.process.stderr.on("data", () => {});
    this.process.on("error", function () {});

    this.process.on("exit", () => {
      this.destroy();
    });
  }

  /**
   * Kills a running SFU process.
   */
  public destroy(): void {
    this.process?.kill("SIGTERM");
    this.process = undefined;
  }

  public getUrls(): Object {
    return {};
  }

  public serialize() {
    return {
      sfuId: this.id,
      sfuData: {},
      sfuPort: this.port,
      sfuTls: this.tls
    };
  }
}

export default DashTransport;

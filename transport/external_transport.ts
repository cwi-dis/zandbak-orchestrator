import childProcess from "child_process";
import { v4 as uuidv4 } from "uuid";

import logger from "../logger";
import Transport, { TransportConfig, TransportUrls } from "./transport";
import User from "../app/user";
import Session from "../app/session";

abstract class ExternalTransport implements Transport {
  public id = uuidv4();
  protected process?: childProcess.ChildProcessWithoutNullStreams;

  protected abstract type: string;
  protected abstract cmdLine: Array<string>;

  #sessions: Array<Session> = [];

  public constructor(protected externalHostname: string, protected transportConfig: TransportConfig, protected port: number) {
  }

  /**
   * Returns the port that this transport is listening on.
   *
   * @returns Port that this transport is running on
   */
  public getPort() {
    return this.port;
  }

  /**
   * Adds a new session to this transport.
   *
   * @param session Session to add to transport
   */
  public addSession(session: Session) {
    this.#sessions.push(session);
  }

  /**
   * Removes a session from this transport.
   *
   * @param session Session to remove from transport
   */
  public removeSession(session: Session) {
    this.#sessions = this.#sessions.filter((s) => s.id != session.id);
  }

  /**
   * Returned the number of sessions that this transport is responsible for.
   *
   * @returns Number of sessions for this transport
   */
  public countSessions(): number {
    return this.#sessions.length;
  }

  /**
   * Starts a new SFU process if one is not already running.
   */
  public start(): void {
    if (this.process) {
      return;
    }

    if(!this.cmdLine || this.cmdLine.length < 1){
      logger.error("No command line provided for SFU");
      return;
    }

    const [ command ] = this.cmdLine;
    const params = this.cmdLine.slice(1).map((param) => {
      return param.replace("%SFU_PORT%", this.port.toString());
    });

    logger.info("Launching new SFU process with ID ", this.id, "for", this.type, "with:", command, params);

    this.process = childProcess.spawn(
      command,
      params,
      { detached: true }
    );

    this.process.stdout.on("data", (data) => {
      logger.debug("SFU", this.id, "stdout:", data);
    });

    this.process.stderr.on("data", (data) => {
      logger.debug("SFU", this.id, "stderr:", data);
    });

    this.process.on("error", (err) => {
      logger.error("SFU", this.id, "error:", err);
    });

    this.process.on("exit", (code) => {
      logger.debug("SFU", this.id, "exit with code:", code);
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

  public abstract getUrls(user: User): TransportUrls;
}

export default ExternalTransport;

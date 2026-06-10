import * as fs from "fs";
import * as path from "path";
import Orchestrator from "../app/orchestrator";
import Session from "../app/session";
import logger from "../logger";
import { Plugin } from "../app/plugin/plugin";
import EmittedEvents from "../app/emitted_events";

export default class TransformLoggerPlugin implements Plugin {
  public name = "TransformLoggerPlugin";
  public description = "Logs broadcasts on the 'transform' channel of sessions to a file.";
  public enabled = false;

  private logStream: fs.WriteStream | null = null;

  public init(orchestrator: Orchestrator) {
    const logPath = path.join(process.cwd(), "transform_logs.txt");
    this.logStream = fs.createWriteStream(logPath, { flags: "a" });

    logger.info("TRANSFORM_LOGGER", `Logging transforms to ${logPath}`);

    // Subscribe to new sessions
    orchestrator.on("SESSION_CREATED", (sessionData: any) => {
      const session = orchestrator.getSession(sessionData.sessionId);
      if (session) {
        this.setupSessionLogging(session);
      }
    });

    // Handle existing sessions
    Object.keys(orchestrator.sessions).forEach((id) => {
      const session = orchestrator.getSession(id);
      if (session) {
        this.setupSessionLogging(session);
      }
    });
  }

  private setupSessionLogging(session: Session) {
    logger.debug("TRANSFORM_LOGGER", `Setting up logging for session ${session.id}`);
    session.on(EmittedEvents.BROADCAST, (event: any) => {
      if (event.channel === "transform") {
        this.logTransform(session.id, event);
      }
    });
  }

  private logTransform(sessionId: string, event: any) {
    if (this.logStream) {
      const buffer = Buffer.from(event.data);
      const utfDecoder = new TextDecoder("UTF-8");

      const logEntry = {
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        fromUserId: event.fromUserId,
        data: JSON.parse(utfDecoder.decode(buffer))
      };

      this.logStream.write(JSON.stringify(logEntry) + "\n");
    }
  }

  public destroy() {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}

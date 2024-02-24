import { getFromEnvironment, loadConfigSync } from "../../util";

import Transport, { TransportConfig } from "../transport";
import DummyTransport from "../dummy_transport";
import ExternalTransport from "../external_transport";
import ExternalTransportBuilder from "./external_transport_builder";
import Session from "../../app/session";
import logger from "../../logger";

export type ExternalTransportType = "dash" | "webrtc";
export type TransportType = ExternalTransportType | "socketio" | "unknown";

const [ EXTERNAL_HOSTNAME ] = getFromEnvironment(["EXTERNAL_HOSTNAME"], null);

class TransportManager {
  #externalTransports: { [key in ExternalTransportType]: Array<ExternalTransport> };

  /**
   * Assigns a transport to the given session and returns the transport. The
   * type of transport returned depends on the value of `protocol`.
   *
   * @param protocol Transport protocol
   * @param session Session to assign new transport to
   * @returns An instantiated transport, depending on the value of `protocol`
   */
  public assignTransport(protocol: TransportType, session: Session): Transport {
    switch (protocol) {
    case "webrtc":
    case "dash":
      logger.debug("Assigning external transport to session", session.name);
      return this.assignExternalTransport(protocol, session);
    case "unknown":
    default:
      logger.debug("Assigning dummy transport to session", session.name);
      return new DummyTransport();
    }
  }

  /**
   * Assigns a child of `ExternalTransport` to the given session. The type of
   * transport assigned depends on the value of the param `protocol`. The method
   * reads the corresponding transport config and instantiates a new transport
   * on an available port defined in the config. If all defined ports have
   * already a running transport instance, assigns the session to the transport
   * with the least number of assigned sessions.
   *
   * @param protocol Transport procotol to use
   * @param session Session to assign transport to
   * @returns An instantiated transport, subclass of `ExternalTransport`, depending on `protocol`
   */
  private assignExternalTransport(protocol: ExternalTransportType, session: Session): ExternalTransport {
    // Load config for protocol type
    const transportConfig: TransportConfig = loadConfigSync(`config/${protocol}-config.json`);
    const { portMapping } = transportConfig;

    // Get all ports delcared in the port mapping
    const declaredPorts = portMapping.map((p) => p.port );
    // Get ports of running transports
    const runningPorts = this.#externalTransports[protocol].map((t) => t.getPort());

    // Get first port which has been declared but not instantiated yet
    const availablePort = declaredPorts.find((p) => !runningPorts.includes(p));

    // If we found a declared but not instantiated port
    if (availablePort) {
      logger.debug("Found unassigned port", availablePort, "for starting", protocol, "transport for session", session.name);

      // Instantiate new transport and return it
      const transport = ExternalTransportBuilder.instantiate(protocol, EXTERNAL_HOSTNAME, availablePort, transportConfig, session);
      this.#externalTransports[protocol].push(transport);

      return transport;
    }

    // Otherwise, return existing transport with least sessions
    const leastOccupiedTransport = this.#externalTransports[protocol].sort((a, b) => {
      if (a.countSessions() < b.countSessions()) {
        return -1;
      } else if (b.countSessions() > b.countSessions()) {
        return 1;
      }

      return 0;
    })[0];

    logger.debug("Assigning session", session.name, "to", protocol, "transport with", leastOccupiedTransport.countSessions(), "sessions");

    // Add session to transport
    leastOccupiedTransport.addSession(session);
    return leastOccupiedTransport;
  }
}

export default TransportManager;

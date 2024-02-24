import { getFromEnvironment, loadConfigSync } from "../../util";

import Transport, { TransportConfig } from "../transport";
import DummyTransport from "../dummy_transport";
import ExternalTransport from "../external_transport";
import ExternalTransportBuilder from "./external_transport_builder";
import Session from "../../app/session";

export type ExternalTransportType = "dash" | "webrtc";
export type TransportType = ExternalTransportType | "socketio" | "unknown";

const [ EXTERNAL_HOSTNAME ] = getFromEnvironment(["EXTERNAL_HOSTNAME"], null);

class TransportManager {
  #externalTransports: { [key in ExternalTransportType]: Array<ExternalTransport> };

  public assignTransport(protocol: TransportType, session: Session): Transport {
    switch (protocol) {
    case "webrtc":
    case "dash":
      return this.assignExternalTransport(protocol, session);
    case "unknown":
    default:
      return new DummyTransport();
    }
  }

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

    leastOccupiedTransport.addSession(session);
    return leastOccupiedTransport;
  }
}

export default TransportManager;

import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { server, io, orchestrator } from "../app";
import { Room } from "../schema";
import EndpointNames from "../endpoints/endpoint_names";
import ErrorCodes from "../endpoints/error_codes";

describe("Telemetry", () => {
  let clientSocket: ClientSocket;
  let port: number;
  let roomId: string;

  beforeAll(async () => {
    orchestrator.qoeEnabled = true;
    
    // Create a dummy room for tests
    const room = await Room.create({
      name: "testRoom",
      description: "Test Room",
      model: "testModel"
    });
    roomId = room.id;

    return new Promise<void>((resolve) => {
      server.listen(() => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll((done) => {
    io.close();
    server.close(() => {
      done();
    });
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      reconnection: false,
      forceNew: true,
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit(EndpointNames.LOGIN, { userName: "testUser" }, (response: any) => {
        if (response.error != ErrorCodes.OK) {
          return fail("Could not login");
        }
        done();
      });
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test("should report telemetry data", (done) => {
    const telemetryData = {
      rttMs: 50,
      jitterMs: 5,
      packetLossRate: 0.01,
      timestamp: Date.now()
    };

    clientSocket.emit(EndpointNames.REPORT_TELEMETRY, { telemetry: telemetryData }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body).toEqual(telemetryData);

      // Verify it's stored on the user by getting user info
      clientSocket.emit(EndpointNames.GET_USER_INFO, {}, (infoResponse: any) => {
        expect(infoResponse.error).toBe(ErrorCodes.OK);
        expect(infoResponse.body.telemetry).toEqual(telemetryData);
        done();
      });
    });
  });

  test("should return error if telemetry data is missing", (done) => {
    clientSocket.emit(EndpointNames.REPORT_TELEMETRY, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.MISSING_PARAMETER);
      done();
    });
  });

  test("should return error if telemetry data types are invalid", (done) => {
    const invalidTelemetryData = {
      rttMs: "50", // should be number
      jitterMs: 5,
      packetLossRate: 0.01,
      timestamp: Date.now()
    };

    clientSocket.emit(EndpointNames.REPORT_TELEMETRY, { telemetry: invalidTelemetryData }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.MISSING_PARAMETER);
      done();
    });
  });

  test("should receive QualityTarget when congested", (done) => {
    // Create a session first
    clientSocket.emit(EndpointNames.ADD_SESSION, {
      sessionName: "testSession",
      sessionProtocol: "socketio",
      sessionRoom: roomId
    }, (sessionResponse: any) => {
      expect(sessionResponse.error).toBe(ErrorCodes.OK);

      // Listen for QualityTarget
      clientSocket.on(EndpointNames.QUALITY_TARGET, (target: any) => {
        expect(target).toBeDefined();
        expect(target.poseUpdateRate).toBe(5); // Congested value
        done();
      });

      // Report bad telemetry to trigger congestion
      const badTelemetry = {
        rttMs: 500,
        jitterMs: 100,
        packetLossRate: 0.2,
        timestamp: Date.now()
      };

      clientSocket.emit(EndpointNames.REPORT_TELEMETRY, { telemetry: badTelemetry }, (reportResponse: any) => {
        expect(reportResponse.error).toBe(ErrorCodes.OK);
        // The health monitor runs every 5s, so we might need to wait.
        // In a real test we might want to speed up the clock or trigger it manually.
        // For now we rely on the 5s interval or we could try to find a way to trigger it.
      });
    });
  }, 10000); // Increase timeout for health monitor
});

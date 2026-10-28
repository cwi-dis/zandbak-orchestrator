import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { server, io } from "../app";
import EndpointNames from "../endpoints/endpoint_names";
import ErrorCodes from "../endpoints/error_codes";

describe("Telemetry", () => {
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    server.listen(() => {
      port = (server.address() as AddressInfo).port;
      done();
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
});

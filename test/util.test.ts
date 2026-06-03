import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { server, io } from "../app";
import EndpointNames from "../endpoints/endpoint_names";

describe("Util Endpoints", () => {
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
      done();
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test("should get orchestrator version", (done) => {
    clientSocket.emit(EndpointNames.GET_ORCHESTRATOR_VERSION, { commandId: "test-1" }, (response: any) => {
      expect(response.commandId).toBe("test-1");
      expect(response.error).toBe(0);
      expect(response.body).toHaveProperty("orchestratorVersion");

      done();
    });
  });
});

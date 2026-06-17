import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { server, io } from "../app";
import EndpointNames from "../endpoints/endpoint_names";
import ErrorCodes from "../endpoints/error_codes";
import { User as UserModel } from "../schema";

describe("Connection Management", () => {
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

  afterEach(async () => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    await UserModel.deleteMany({});
  });

  test("should not login without username", (done) => {
    clientSocket.emit(EndpointNames.LOGIN, {}, (response: any) => {
      expect(response.error).not.toBe(0);
      expect(response.error).toBe(ErrorCodes.MISSING_CREDENTIALS);

      done();
    });
  });

  test("should not login with database user that does not exist", (done) => {
    clientSocket.emit(EndpointNames.LOGIN, { userName: "test", password: "test" }, (response: any) => {
      expect(response.error).not.toBe(0);
      expect(response.error).toBe(ErrorCodes.INVALID_CREDENTIALS);

      done();
    });
  });

  test("should login successfully with database user", async () => {
    // Create a test user in the database
    const username = "dbuser";
    const password = "dbpassword";
    const user = new UserModel({
      username,
      password,
    });
    await user.save();

    return new Promise<void>((resolve) => {
      clientSocket.emit(EndpointNames.LOGIN, { userName: username, password: password }, (response: any) => {
        expect(response.error).toBe(ErrorCodes.OK);
        expect(response.body.userData.userName).toBe(username);
        resolve();
      });
    });
  });

  test("should fail login with incorrect password for database user", async () => {
    // Create a test user in the database
    const username = "dbuser2";
    const password = "dbpassword2";
    const user = new UserModel({
      username,
      password,
    });
    await user.save();

    return new Promise<void>((resolve) => {
      clientSocket.emit(EndpointNames.LOGIN, { userName: username, password: "wrongpassword" }, (response: any) => {
        expect(response.error).toBe(ErrorCodes.INVALID_CREDENTIALS);
        resolve();
      });
    });
  });

  test("should login successfully without password (ephemeral user)", (done) => {
    const username = "ephemeral";
    clientSocket.emit(EndpointNames.LOGIN, { userName: username }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.userData.userName).toBe(username);
      done();
    });
  });

  test("should not login if a user with the same username is already logged in", (done) => {
    const username = "existingUser";

    clientSocket.emit(EndpointNames.LOGIN, { userName: username }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.userData.userName).toBe(username);

      clientSocket.emit(EndpointNames.LOGIN, { userName: username }, (response: any) => {
        expect(response.error).toBe(ErrorCodes.USER_EXISTS);
        done();
      });
    });
  });
});

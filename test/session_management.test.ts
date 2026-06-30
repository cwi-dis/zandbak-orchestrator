import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { server, io } from "../app";
import EndpointNames from "../endpoints/endpoint_names";
import ErrorCodes from "../endpoints/error_codes";
import { Room as RoomModel } from "../schema";

describe("Session management", () => {
  let clientSocket: ClientSocket;
  let port: number;
  let roomId: string;

  beforeAll((done) => {
    server.listen(() => {
      port = (server.address() as AddressInfo).port;

      const room = new RoomModel({
        name: "Room 1"
      });

      room.save().then((room) => {
        roomId = room._id.toString();
        done();
      }).catch((reason) => {
        fail(reason);
      });
    });
  });

  afterAll((done) => {
    io.close();

    server.close(() => {
      RoomModel.deleteMany().then(() => done());
    });
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      reconnection: false,
      forceNew: true,
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit(EndpointNames.LOGIN, { userName: "test" }, (response: any) => {
        if (response.error == ErrorCodes.OK) {
          done();
        } else {
          fail("Could not login");
        }
      });
    });
  });

  afterEach(async () => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test("should not create a session without room", (done) => {
    clientSocket.emit(EndpointNames.ADD_SESSION, { sessionName: "New session" }, (response: any) => {
      expect(response.error).not.toBe(ErrorCodes.OK);
      expect(response.error).toBe(ErrorCodes.SESSION_ROOM_DOES_NOT_EXIST);

      done();
    });
  });

  test("should create a session with the given name", (done) => {
    clientSocket.emit(EndpointNames.ADD_SESSION, { sessionName: "New session", sessionRoom: roomId }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.sessionName).toBe("New session");

      done();
    });
  });

  test("should return a list of rooms", (done) => {
    clientSocket.emit(EndpointNames.GET_ROOMS, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe("Room 1");

      done();
    });
  });

  test("should return an empty list sessions", (done) => {
    clientSocket.emit(EndpointNames.GET_SESSIONS, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body).toBeInstanceOf(Object);

      const sessions = new Map(Object.entries(response.body));
      expect(Array.from(sessions.keys()).length).toBe(0);

      done();
    });
  });

  test("should return a list of sessions with one entry", (done) => {
    clientSocket.emit(EndpointNames.ADD_SESSION, { sessionName: "new test session", sessionRoom: roomId }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      const createdSession = response.body;

      clientSocket.emit(EndpointNames.GET_SESSIONS, {}, (response: any) => {
        expect(response.error).toBe(ErrorCodes.OK);
        expect(response.body).toBeInstanceOf(Object);

        const sessions = new Map(Object.entries(response.body));
        expect(Array.from(sessions.keys()).length).toBe(1);
        expect(sessions.get(createdSession.sessionId)).toBeDefined();

        const session = sessions.get(createdSession.sessionId) as any;
        expect(session.sessionName).toBe("new test session");

        done();
      });
    });
  });

  test("should return an error for getting session info if user is not in any session", (done) => {
    clientSocket.emit(EndpointNames.GET_SESSION_INFO, {}, (response: any) => {
      expect(response.error).not.toBe(ErrorCodes.OK);
      expect(response.error).toBe(ErrorCodes.SESSION_USER_NOT_IN_SESSION);

      done();
    });
  });
});

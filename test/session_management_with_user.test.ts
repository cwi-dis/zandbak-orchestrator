import { AddressInfo } from "net";
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { server, io } from "../app";
import EndpointNames from "../endpoints/endpoint_names";
import ErrorCodes from "../endpoints/error_codes";
import { Room as RoomModel } from "../schema";
import EmittedEvents from "../app/emitted_events";

describe("Session management with user", () => {
  let clientSocket: ClientSocket;
  let port: number;
  let roomId: string;
  let currentUserId: string;

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
        if (response.error != ErrorCodes.OK) {
          return fail("Could not login");
        }

        currentUserId = response.body.userId;

        clientSocket.emit(EndpointNames.ADD_SESSION, { sessionName: "Session test", sessionRoom: roomId }, (response: any) => {
          if (response.error != ErrorCodes.OK) {
            return fail("Could not create session");
          }

          done();
        });
      });
    });
  });

  afterEach(async () => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test("should leave the session", (done) => {
    clientSocket.emit(EndpointNames.LEAVE_SESSION, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      done();
    });
  });

  test("should send message to all", (done) => {
    clientSocket.on(EmittedEvents.MESSAGE_SENT, (data: any) => {
      expect(data.message).toBe("hello world");
      expect(data.sender.userName).toBe("test");

      done();
    });

    clientSocket.emit(EndpointNames.SEND_MESSAGE_TO_ALL, { message: "hello world" }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
    });
  });

  test("should get an empty list of messages initially", (done) => {
    clientSocket.emit(EndpointNames.GET_MESSAGES, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.length).toBe(0);

      done();
    });
  });

  test("should get a list of sent messages", (done) => {
    clientSocket.emit(EndpointNames.SEND_MESSAGE_TO_ALL, { message: "hello world" }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);

      clientSocket.emit(EndpointNames.SEND_MESSAGE_TO_ALL, { message: "hello world" }, (response: any) => {
        expect(response.error).toBe(ErrorCodes.OK);
        clientSocket.emit(EndpointNames.GET_MESSAGES, {}, (response: any) => {
          expect(response.error).toBe(ErrorCodes.OK);
          expect(response.body.length).toBe(2);

          done();
        });
      });
    });
  });

  test("should get a list of sent messages with a given maximum", (done) => {
    clientSocket.emit(EndpointNames.SEND_MESSAGE_TO_ALL, { message: "hello world" }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);

      clientSocket.emit(EndpointNames.SEND_MESSAGE_TO_ALL, { message: "hello world" }, (response: any) => {
        expect(response.error).toBe(ErrorCodes.OK);
        clientSocket.emit(EndpointNames.GET_MESSAGES, { count: 1 }, (response: any) => {
          expect(response.error).toBe(ErrorCodes.OK);
          expect(response.body.length).toBe(1);

          done();
        });
      });
    });
  });

  test("should return an error if trying to send a message to a non-existing user", (done) => {
    clientSocket.emit(EndpointNames.SEND_MESSAGE, { message: "hello", userId: "does_not_exist" }, (response: any) => {
      expect(response.error).not.toBe(ErrorCodes.OK);
      expect(response.error).toBe(ErrorCodes.SESSION_USER_NOT_IN_SAME_SESSION);

      done();
    });
  });

  test("should send private message to given user", (done) => {
    clientSocket.on(EmittedEvents.MESSAGE_SENT, (data: any) => {
      expect(data.message).toBe("hello user");
      expect(data.sender.userName).toBe("test");
      expect(data.private).toBe(true);

      done();
    });

    clientSocket.emit(EndpointNames.SEND_MESSAGE, { message: "hello user", userId: currentUserId }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
    });
  });

  test("should raise hand", (done) => {
    clientSocket.emit(EndpointNames.RAISE_HAND, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      done();
    });
  });

  test("should clear raised hand", (done) => {
    clientSocket.emit(EndpointNames.RAISE_HAND, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);

      clientSocket.emit(EndpointNames.CLEAR_RAISED_HAND, {}, (response: any) => {
        expect(response.error).toBe(ErrorCodes.OK);
        done();
      });
    });
  });

  test("should get empty list of raised hands initially", (done) => {
    clientSocket.emit(EndpointNames.GET_RAISED_HANDS, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.length).toBe(0);

      done();
    });
  });

  test("should get list of raised hands", (done) => {
    clientSocket.emit(EndpointNames.RAISE_HAND, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);

      clientSocket.emit(EndpointNames.GET_RAISED_HANDS, {}, (response: any) => {
        expect(response.error).toBe(ErrorCodes.OK);
        expect(response.body.length).toBe(1);
        expect(response.body[0].userName).toBe("test");

        done();
      });
    });
  });

  test("should raise hand", (done) => {
    clientSocket.emit(EndpointNames.RAISE_HAND, {}, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      done();
    });
  });

  test("should set isSpeaking flag", (done) => {
    clientSocket.emit(EndpointNames.IS_SPEAKING, { isSpeaking: true }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.isSpeaking).toBe(true);

      done();
    });
  });

  test("should set session status to the given value", (done) => {
    clientSocket.emit(EndpointNames.SET_SESSION_STATUS, { status: "new status" }, (response: any) => {
      expect(response.error).toBe(ErrorCodes.OK);
      expect(response.body.sessionStatus).toBe("new status");

      done();
    });
  });
});

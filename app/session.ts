import uuid from "uuid";
import User from "./user";
import { Object } from "../util";

class Session {
  private id: string = uuid.v4();
  private users: Array<User> = [];

  public constructor(
    private name: string,
    private description: string
  ) {}

  public removeUser(user: User) {
    this.notifyUsers({
      "eventId": "USER_LEAVED_SESSION",
      "eventData": {
        "userId": user.id,
        "message": "User logged out of orchestrator"
      }
    });

    this.users = this.users.filter((u) => u.id != user.id);
  }

  private notifyUsers(message: Object) {
    this.users.forEach((u) => {
      u.socket.emit("SessionUpdated", message);
    });
  }
}

export default Session;

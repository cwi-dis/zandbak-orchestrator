import { v4 as uuidv4 } from "uuid";

import { Dict } from "../util";
import Serializable from "./serializable";
import User from "./user";

class ChatMessage extends Serializable {
  #id: string;
  #sender: User;
  #message: Dict;
  #timestamp: Date;

  constructor(sender: User, message: Dict) {
    super();

    this.#id = uuidv4();
    this.#sender = sender;
    this.#message = message;
    this.#timestamp = new Date();
  }

  public get id(): string {
    return this.#id;
  }

  public get sender(): User {
    return this.#sender;
  }

  public get message(): Dict {
    return this.#message;
  }

  public get timestamp(): Date {
    return this.#timestamp;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      sender: this.#sender.serialize(),
      message: this.#message,
      timestamp: this.#timestamp
    };
  }
}

export default ChatMessage;

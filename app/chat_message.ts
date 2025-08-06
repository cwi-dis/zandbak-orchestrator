import { v4 as uuidv4 } from "uuid";

import { Dict } from "../util";
import Serializable from "./serializable";
import User from "./user";

class ChatMessage extends Serializable {
  #id: string = uuidv4();
  #timestamp: Date = new Date();
  #sender: User;
  #message: Dict;

  _private: boolean = false;

  constructor(sender: User, message: Dict) {
    super();

    this.#sender = sender;
    this.#message = message;
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

  public get private(): boolean {
    return this._private;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      sender: this.#sender.serialize(),
      message: this.#message,
      timestamp: this.#timestamp,
      private: this._private
    };
  }
}

export class PrivateMessage extends ChatMessage {
  constructor(sender: User, message: Dict) {
    super(sender, message);
    this._private = true;
  }
}

export default ChatMessage;

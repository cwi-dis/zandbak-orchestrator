import { Dict } from "../util";
import Serializable from "./serializable";

class Room extends Serializable {
  #id: string;
  #name: string;
  #description: string;
  #filename: string;

  public constructor(id: string, name: string, description = "", filename = "") {
    super();

    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#filename = filename;
  }

  public get id() {
    return this.#id;
  }

  public get name() {
    return this.#name;
  }

  public get description() {
    return this.#description;
  }

  public get filename() {
    return this.#filename;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      filename: this.#filename,
    };
  }
}

export default Room;

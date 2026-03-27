import { Dict } from "../util";
import Serializable from "./serializable";

class Room extends Serializable {
  #id: string;
  #name: string;
  #description: string;
  #model: string;

  public constructor(id: string, name: string, description = "", filename = "") {
    super();

    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#model = filename;
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
    return this.#model;
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      model: this.#model,
    };
  }
}

export default Room;

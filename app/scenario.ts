import Serializable from "./serializable";

class Scenario implements Serializable {
  #id: string;

  public constructor(id: string, public name: string, public description: string) {
    this.#id = id;
  }

  public get id() {
    return this.#id;
  }

  public serialize() {
    return {
      scenarioId: this.#id,
      scenarioName: this.name,
      scenarioDescription: this.description
    };
  }
}

export default Scenario;

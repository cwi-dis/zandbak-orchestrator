import Serializable from "./serializable";

class Scenario implements Serializable {
  #id: string;

  public constructor(id: string, public name: string, public description: string) {
    this.#id = id;
  }

  public get id() {
    return this.#id;
  }

  /**
   * Returns the scenario's properties as an object
   *
   * @returns Object with serialised scenario fields
   */
  public serialize() {
    return {
      scenarioId: this.#id,
      scenarioName: this.name,
      scenarioDescription: this.description
    };
  }
}

export default Scenario;

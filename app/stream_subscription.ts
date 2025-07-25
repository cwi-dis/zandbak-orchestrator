import Serializable from "./serializable";
import User from "./user";

class StreamSubscription extends Serializable {
  #id: string;
  #userId: string;

  public constructor(user: User, public type: string, public description: string = "") {
    super();

    this.#id = StreamSubscription.genId(user.id, type);
    this.#userId = user.id;
  }

  public get id() {
    return this.#id;
  }

  public static genId(userId: string, type: string) {
    return `${userId}::${type}`;
  }

  public serialize() {
    return {
      dataStreamUserId: this.#userId,
      dataStreamKind: this.type,
      dataStreamDescription: this.description
    };
  }
}

export default StreamSubscription;

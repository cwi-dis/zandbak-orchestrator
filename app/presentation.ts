import Serializable from "./serializable";

class Presentation implements Serializable {
  #name: string;
  #description: string;
  #presenter: string;

  #slidesUrl: string;
  #currentSlide: number = 0;

  constructor(name: string, description: string, presenter: string, slidesUrl: string) {
    this.#name = name;
    this.#description = description;
    this.#presenter = presenter;
    this.#slidesUrl = slidesUrl;
  }

  public get name() {
    return this.#name;
  }

  public get description() {
    return this.#description;
  }

  public get presenter() {
    return this.#presenter;
  }

  public get slidesUrl() {
    return this.#slidesUrl;
  }

  public get currentSlide() {
    return this.#currentSlide;
  }

  public set currentSlide(slide: number) {
    this.#currentSlide = slide;
  }

  public serialize() {
    return {
      name: this.#name,
      description: this.#description,
      presenter: this.#presenter,
      slidesUrl: this.#slidesUrl,
      currentSlide: this.#currentSlide
    };
  }
}

export default Presentation;

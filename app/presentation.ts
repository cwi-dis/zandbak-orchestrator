import Serializable from "./serializable";

class Presentation extends Serializable {
  #id: string;
  #name: string;
  #description: string;
  #presenter: string;

  #slidesUrl: string;
  #currentSlide: number = 0;
  #numSlides: number;

  isSharing = false;

  constructor(id: string, name: string, description: string, presenter: string, slidesUrl: string, numSlides: number) {
    super();

    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#presenter = presenter;
    this.#slidesUrl = slidesUrl;
    this.#numSlides = numSlides;
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

  public get presenter() {
    return this.#presenter;
  }

  public get slidesUrl() {
    return this.#slidesUrl;
  }

  public get currentSlide() {
    return this.#currentSlide;
  }

  public get numSlides() {
    return this.#numSlides;
  }

  public set currentSlide(slide: number) {
    this.#currentSlide = slide;
  }

  public serialize() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      presenter: this.#presenter,
      slidesUrl: this.#slidesUrl,
      currentSlide: this.#currentSlide,
      numSlides: this.#numSlides,
      isSharing: this.isSharing
    };
  }
}

export default Presentation;

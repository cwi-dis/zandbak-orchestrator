import { v4 as uuidv4 } from "uuid";

import Serializable from "./serializable";
import User from "./user";
import { Dict } from "../util";
import { BubbleEvent } from "./emitted_events";

class Bubble extends Serializable {
  #id: string = uuidv4();
  #name: string;
  #owner: User;
  #users: Array<User> = [];
  #invitations: Set<string> = new Set();

  public constructor(name: string, owner: User) {
    super();

    this.#name = name;
    this.#owner = owner;
    this.#users.push(owner);
    this.#owner.bubble = this;
  }

  public get id(): string {
    return this.#id;
  }

  public get name(): string {
    return this.#name;
  }

  public get owner(): User {
    return this.#owner;
  }

  public get users(): Array<User> {
    return this.#users;
  }

  /**
   * Checks whether the given user (or user ID) is a member of this bubble.
   * The check is performed by comparing user IDs.
   *
   * @param user The user object or the ID of the user to check
   * @returns True if the given user is in the bubble, false otherwise
   */
  public isInBubble(user: User | string) {
    // If the given param is a string, interpret it as a user ID
    if (typeof user == "string") {
      return this.#users.find((u) => u.id == user) != undefined;
    }

    return this.#users.find((u) => u.id == user.id) != undefined;
  }

  /**
   * Adds the given user to this bubble.
   * Returns true if the user was successfully added to the bubble. If the
   * given user is already a member of this bubble, nothings happens and the
   * method returns false.
   *
   * @param user User to add to this bubble
   * @returns True if the user was added successfully, false otherwise
   */
  public addUser(user: User): boolean {
    if (this.isInBubble(user)) {
      return false;
    }

    user.bubble = this;
    this.#users.push(user);
    this.notifyUsers({
      eventId: "USER_JOINED_BUBBLE",
      eventData: user.serialize()
    });

    return true;
  }

  /**
   * Removes the given user from the bubble if it is a member of it. If the
   * given user is not in this bubble, nothing happens and the method returns
   * false.
   *
   * @param user User to remove
   * @returns True if the user was removed from the bubble, false otherwise
   */
  public removeUser(user: User): boolean {
    const filteredUsers = this.#users.filter((u) => u.id != user.id);

    if (user.bubble?.id == this.id) {
      user.bubble == undefined;
    }

    if (filteredUsers.length == this.#users.length) {
      return false;
    }

    this.#users = filteredUsers;
    this.notifyUsers({
      eventId: "USER_LEFT_BUBBLE",
      eventData: user.serialize()
    });

    return true;
  }

  /**
   * Adds the given user to the list of users invited to this bubble.
   *
   * @param user User to add to list of invitations
   */
  public addInvitation(user: User) {
    this.#invitations.add(user.id);
  }

  /**
   * Checks if the given user has been invited to this bubble.
   *
   * @param user User for which we want to check whether they have an invitation
   * @returns True if the user has been invited to this bubble, false otherwise
   */
  public hasInvitation(user: User): boolean {
    return this.#invitations.has(user.id);
  }

  /**
   * Clears the bubble invitation for the given user. Returns true if the
   * invitation has been cleared. If the given user has not been invited to this
   * bubble or the invitation could not be cleared, false is returned.
   *
   * @param user User for which we want to clear the invitation
   * @returns True if the invitation has been cleared, false otherwise
   */
  public clearInvitation(user: User): boolean {
    if (!this.hasInvitation(user)) {
      return false;
    }

    return this.#invitations.delete(user.id);
  }

  public sendJoinRequestToOwner(requestingUser: User) {
    this.owner.sendBubbleUpdate({
      eventId: "BUBBLE_JOIN_REQUESTED",
      eventData: {
        requestingUserId: requestingUser.id
      },
    });
  }

  private notifyUsers(event: BubbleEvent) {
    this.#users.forEach((u) => {
      u.sendBubbleUpdate(event);
    });
  }

  public serialize(): Dict {
    return {
      id: this.#id,
      name: this.#name,
      owner: this.#owner.serialize(),
      users: this.#users.map((u) => u.serialize())
    };
  }
}

export default Bubble;

import * as util from "../util";
import logger from "../logger";

import ErrorCodes from "./error_codes";
import EndpointNames from "./endpoint_names";
import User from "../app/user";


const installHandlers = (user: User) => {
  const { socket } = user;

  /**
   * Creates a new conversation bubble within the users current session with
   * the given name. The current user is added as owner to the created bubble.
   * If no name is given the new bubble's name will be set to 'Conversation
   * Bubble'. If the user is in no session, an error is issued.
   *
   * Upon success, a serialised version of the newly created bubble is returned
   * to the caller.
   */
  socket.on(EndpointNames.CREATE_BUBBLE, (data, callback) => {
    const { session } = user;
    const { name = "Conversation Bubble" } = data;

    if (!session) {
      logger.debug(EndpointNames.CREATE_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const bubble = session.createBubble(name, user);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      bubble.serialize()
    ));
  });

  /**
   * Removes the current user from a bubble identified by a given parameter
   * named `id`. The bubble identified by the given ID must be part of the
   * user's current session. If the user is not in any session, no ID is given,
   * the bubble could not be found or the current user is not a member of the
   * given bubble, an error is issued. Upon success a serialised version of the
   * updated bubble is returned.
   */
  socket.on(EndpointNames.LEAVE_BUBBLE, (data, callback) => {
    const { session } = user;
    const { id } = data;

    if (!session) {
      logger.debug(EndpointNames.LEAVE_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    if (!id) {
      logger.debug(EndpointNames.LEAVE_BUBBLE, "No parameter `id` supplied");
      return callback(util.createCommandResponse(data, ErrorCodes.MISSING_PARAMETER));
    }

    // Search for bubble in session
    const bubble = session.findBubble(id);

    // Return error if bubble is not found
    if (!bubble) {
      logger.debug(EndpointNames.LEAVE_BUBBLE, "Bubble with ID", id, "not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    // Try and remove user from bubble
    const wasRemoved = bubble.removeUser(user);

    if (!wasRemoved) {
      logger.debug(EndpointNames.LEAVE_BUBBLE, "User", user.name, "is not a member of the given bubble");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_DOESNT_HAVE_USER));
    }

    session.sendSessionUpdate("USER_LEFT_BUBBLE", {
      userId: id,
      bubbleId: bubble.id
    });

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      bubble.serialize()
    ));
  });

  /**
   * Returns a serialised list of active bubbles in the user's current session.
   * If the current user is not in any session at the moment, an error is
   * issued.
   */
  socket.on(EndpointNames.LIST_BUBBLES, (data, callback) => {
    const { session } = user;

    if (!session) {
      logger.debug(EndpointNames.LIST_BUBBLES, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      session.bubbles.map((b) => b.serialize())
    ));
  });

  /**
   * Allows the current user to request the joining of a given bubble,
   * identified by its ID. After issuing this request, an event is sent to the
   * owner of the given bubble and they can then approve or reject the request.
  */
  socket.on(EndpointNames.REQUEST_JOIN_BUBBLE, (data, callback) => {
    const { session } = user;
    const { id: bubbleId } = data;

    // User is not in any session
    if (!session) {
      logger.debug(EndpointNames.REQUEST_JOIN_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    // Find the given bubble
    const bubbleToJoin = session.findBubble(bubbleId);

    // Bubble with given ID was not found
    if (!bubbleToJoin) {
      logger.debug(EndpointNames.REQUEST_JOIN_BUBBLE, "Bubble with ID", bubbleId, "not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    // Get bubble owner
    const { owner } = bubbleToJoin;

    // TODO send join request notification to bubble owner

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK
    ));
  });

  socket.on(EndpointNames.APPROVE_BUBBLE_JOIN_REQUEST, (data, callback) => {
    const { session } = user;
    const { userId, bubbleId, approve }: { userId: string, bubbleId: string, approve: boolean } = data;

    // User is not in any session
    if (!session) {
      logger.debug(EndpointNames.APPROVE_BUBBLE_JOIN_REQUEST, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const bubble = session.findBubble(bubbleId);

    // Bubble with given ID was not found
    if (!bubble) {
      logger.debug(EndpointNames.APPROVE_BUBBLE_JOIN_REQUEST, "Bubble with ID", bubbleId, "not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    // Check whether requesting user is owner of this bubble
    if (bubble.owner.id != user.id) {
      logger.debug(EndpointNames.APPROVE_BUBBLE_JOIN_REQUEST, "Current user is not owner of this bubble");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_ACTION_NOT_ALLOWED));
    }

    // Get user to add from session
    const userToAdd = session.getUser(userId);

    if (!userToAdd) {
      logger.debug(EndpointNames.APPROVE_BUBBLE_JOIN_REQUEST, "User to add not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    // Add user if `approve` is true
    if (approve) {
      bubble.addUser(userToAdd);
      // TODO send join notification to user
    } else {
      // TODO send reject notification to user
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK
    ));
  });
};

export default installHandlers;

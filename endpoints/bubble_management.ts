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
   * Retrieves a bubble given its ID. If the user is not in any session of if
   * the bubble with the given ID cannot be found, an error is returned.
   *
   * Upon success, a serialised version of the bubble is returned to the caller.
   */
  socket.on(EndpointNames.GET_BUBBLE, (data, callback) => {
    const { session } = user;
    const { bubbleId } = data;

    if (!session) {
      logger.debug(EndpointNames.CREATE_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const bubble = session.findBubble(bubbleId);

    // Return error if bubble is not found
    if (!bubble) {
      logger.debug(EndpointNames.LEAVE_BUBBLE, "Bubble with ID", bubbleId, "not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK,
      bubble.serialize()
    ));
  });

  /**
   * Removes the current user from their current bubble. If the user is not in
   * any session, the bubble could not be found or the current user is not a
   * member of any bubble, an error is issued. Upon success a serialised version
   * of the updated bubble is returned.
   *
   * If the bubble becomes empty after removing the user, it is deleted as well.
   */
  socket.on(EndpointNames.LEAVE_BUBBLE, (data, callback) => {
    const { session } = user;

    if (!session) {
      logger.error(EndpointNames.LEAVE_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    // Search for bubble in session
    const { bubble } = user;

    // Return error if bubble is not found
    if (!bubble) {
      logger.error(EndpointNames.LEAVE_BUBBLE, "User is not in any bubble");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    logger.debug(EndpointNames.LEAVE_BUBBLE, "Removing", user.name, "from bubble", bubble.name);

    // Try and remove user from bubble
    const wasRemoved = bubble.removeUser(user);

    if (!wasRemoved) {
      logger.error(EndpointNames.LEAVE_BUBBLE, "User", user.name, "is not a member of the given bubble");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_DOESNT_HAVE_USER));
    }

    session.sendSessionUpdate("USER_LEFT_BUBBLE", {
      userId: user.id,
      bubbleId: bubble.id
    });

    // Removing bubble altogether if bubble is empty
    if (bubble.users.length == 0) {
      logger.debug(EndpointNames.LEAVE_BUBBLE, "Bubble", bubble.name, "has become empty, removing...");
      session.removeBubble(bubble);

      session.sendSessionUpdate("BUBBLE_REMOVED", {
        bubbleId: bubble.id
      });
    }

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

    bubbleToJoin.sendJoinRequestToOwner(user);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK
    ));
  });

  /**
   * Allows the owner of a bubble to approve or reject bubble join requests.
   * The requesting user ID, the bubble ID and approval status are given as
   * parameters. If the approval status flag is true, the requesting user is
   * added to the given bubble and a notification is sent to all members. The
   * requesting user receives an additional notification that their request
   * has been granted. If the the reqeust has been denied, only the requesting
   * user receives a notification.
  */
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
    }

    userToAdd.sendSessionUpdate({
      eventId: "BUBBLE_JOIN_REQUEST_APPROVED",
      eventData: {
        bubbleId: bubble.id,
        approve
      }
    });

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK
    ));
  });

  /**
   * Allows the current user to invite another user in the same session to join
   * the bubble that the current user is in. The user to invite is identified
   * by their user ID.
   * If the current user is not in any session or not in any bubble, an error
   * will be returned and nothing happens. If the invited user could not be
   * found in the current session, an error will be returned.
   * Upon success, the invited user will received an invitation event
   * containing the ID of the bubble they have been invited to.
  */
  socket.on(EndpointNames.SEND_BUBBLE_INVITATION, (data, callback) => {
    const { userId }: { userId: string } = data;
    const { session, bubble } = user;

    // Requesting user is not in any session
    if (!session) {
      logger.debug(EndpointNames.SEND_BUBBLE_INVITATION, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    // Requesting user is not in a bubble
    if (!bubble) {
      logger.debug(EndpointNames.SEND_BUBBLE_INVITATION, "User is currently not in a bubble");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    // Find user to invite
    const userToInvite = session.getUser(userId);

    // Invited user not found
    if (!userToInvite) {
      logger.debug(EndpointNames.SEND_BUBBLE_INVITATION, "User to add not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    // Store invitation for bubble
    bubble.addInvitation(userToInvite);

    // Send invitation to invited user
    userToInvite.sendSessionUpdate({
      eventId: "BUBBLE_JOIN_INVITED",
      eventData: {
        bubbleId: bubble.id
      }
    });

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK
    ));
  });

  /**
   * Allows the current user to join a bubble identified by its bubble ID.
   * If the requesting user has not previously been invited to the given bubble,
   * and error is returned.
  */
  socket.on(EndpointNames.JOIN_BUBBLE, (data, callback) => {
    const { session } = user;
    const { bubbleId }: { bubbleId: string } = data;

    // User is not in any session
    if (!session) {
      logger.debug(EndpointNames.JOIN_BUBBLE, "User", user.name, "not in any session");
      return callback(util.createCommandResponse(data, ErrorCodes.SESSION_USER_NOT_IN_SESSION));
    }

    const bubble = session.findBubble(bubbleId);

    // Bubble with given ID was not found
    if (!bubble) {
      logger.debug(EndpointNames.JOIN_BUBBLE, "Bubble with ID", bubbleId, "not found in this session");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_NOT_FOUND));
    }

    // Check if user is invited to bubble
    if (!bubble.hasInvitation(user)) {
      logger.debug(EndpointNames.JOIN_BUBBLE, "User has not been invited to this bubble");
      return callback(util.createCommandResponse(data, ErrorCodes.BUBBLE_INVITE_NOT_FOUND));
    }

    // Add user, clear invitation and return success
    bubble.addUser(user);
    bubble.clearInvitation(user);

    callback(util.createCommandResponse(
      data,
      ErrorCodes.OK
    ));
  });
};

export default installHandlers;

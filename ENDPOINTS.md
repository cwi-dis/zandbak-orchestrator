# Orchestrator Event Interface

This document specifies all the endpoints that the Orchestrator exposes to its
clients through Socket.IO. The corresponding code can be found in the files
located in the folder `endpoints/`.

## ADD_SESSION

Endpoint invoked for the user to create a new session with the given data.
Returns a serialised version of the session to the caller upon success.

## DECLARE_DATA_STREAM

Declares a new data stream for the current user by taking stream type and
description as parameters. Returns a serialised list of connection
information and declared data streams.

## DELETE_SESSION

Deletes a session given by its session ID. The calling user must be the
administrator of the session and the session must be empty for the call
to be successful.

## DUMP_DATA

Dumps the entire data tree of the orchestrator and sends it to the caller.

## GET_NTP_TIME

Returns the current time as determined using NTP.

## GET_ORCHESTRATOR_VERSION

Returns the version of the orchestrator inside a JSON object.

## GET_SESSIONS

Returns a serialised object of active sessions to the caller indexed by
session ID.

## GET_SESSION_INFO

Returns a serialised version of the user's current session or the session
that this user is an admin of. If the user is not in any session or not an
admin of any session, an error is issued.

## GET_USER_DATA

Returns the `userData` object associated to a user identified by the key
`userId` in the request. If no such key is found, the `userData` for the
current user is returned. If a user ID is given and no associated user
could be found, an error is issued.

## JOIN_SESSION

Adds the current user to an existing session identified by the given
session ID. If the user is already in a session (including the given
session), an error is issued.

## LEAVE_SESSION

Removes the user from their current session. If the user is not in an
session, an error is issued.

## LOGIN

Creates a new user with the given username which is stored in the
enclosing promise. If the received data contained no username, causes
the promise to reject.

## LOGOUT

Logs the user out from the orchestrator, removing them from their session
first.

## REGISTER_FOR_DATA_STREAM

Registers the current user for a data stream from the user with the given
ID and the given stream type.

## REMOVE_DATA_STREAM

Removes a data stream for the current user by taking stream type as
parameter. Returns a serialised list of connection information and
declared data streams after the removal operation

## SEND_DATA

Sends data from the current user to all users in the same session,
provided they are registered for the given stream type. If either the
stream type of the data are not provided, nothing happens.

## SEND_MESSAGE

Sends a given message from the current user to the user identified by the
given user ID. If the receiver is not in the same session or the sender is
not in any session, an error is issued.

## SEND_MESSAGE_TO_ALL

Sends a given message to all users in the user's current session. This also
includes the sender itself. If the user not in any session, an error is
issued.

## SEND_SCENE_EVENT_TO_ALL

Sends a scene event from a session master to all users of the session. If
the master is not in any session or the request data is empty, an error is
issued. An error is also returned if the calling user is not the master of
their session.

## SEND_SCENE_EVENT_TO_MASTER

Sends a scene event to the master of the user's current session. If the
user is not in any session, the request data is empty or the session has
no master, an error is issued.

## SEND_SCENE_EVENT_TO_USER

Sends a scene event from a session master to a regular user. If the
master is not in any session or the request data is empty, an error is
issued. An error is also returned if the calling user is not the master of
their session.

## TERMINATE_ORCHESTRATOR

Terminates the orchestrator process.

## UNREGISTER_FROM_DATA_STREAM

Unregisters the current user from a remote data stream from the user with
the given ID and the given stream type.

## UPDATE_USER_DATA

Updates the `userData` property for the current user. The updated user
data object is returned in the response. A notification is also sent to
all session members. If the request does not contain the field
`userDataJson`, an error is issued.


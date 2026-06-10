# InduXR Orchestrator Endpoints

This document specifies all the endpoints that the Orchestrator exposes to its
clients through Socket.IO. The corresponding code can be found in the files
located in the folder `endpoints/`.

Moreover, the document presents some performance characteristics and presents
suggestions for horizontal scaling of the application.

## Orchestrator Event Interface

### User Management

#### `LOGIN`

Creates a new user with the given username which is stored in the
enclosing promise. If the received data contained no username, causes
the promise to reject. Supports optional password for database authentication,
`deviceType`, `prefabName`, and a specific `id`.

#### `LOGOUT`

Logs the user out from the orchestrator, removing them from their session
first.

#### `GET_USER_DATA`

Returns the `userData` object associated to a user identified by the key
`userId` in the request. If no such key is found, the `userData` for the
current user is returned. If a user ID is given and no associated user
could be found, an error is issued.

#### `UPDATE_USER_DATA`

Updates the `userData` property for the current user. The updated user
data object is returned in the response. A notification is also sent to
all session members. If the request does not contain the field
`userDataJson`, an error is issued.

#### `SET_USER_STATUS`

Updates the `status` property for the current user. A notification is also sent
to all session members.

#### `GET_USER_INFO`

Returns a serialised version of the user object identified by the given
user ID. If no ID is given, the data for the current user is returned.

### Session Management

#### `ADD_SESSION`

Endpoint invoked for the user to create a new session with the given data.
Returns a serialised version of the session to the caller upon success.

#### `SCHEDULE_SESSION`

Schedules a session from a session defined in the database by passing the
session ID as parameter. The creating user is added as an administrator to
the session.

#### `DELETE_SESSION`

Deletes a session given by its session ID. The calling user must be the
administrator of the session and the session must be empty for the call
to be successful.

#### `GET_SESSIONS`

Returns a serialised object of active sessions to the caller indexed by
session ID.

#### `GET_ROOMS`

Returns a serialised object of available rooms from the database, indexed by
room ID.

#### `GET_SCHEDULED_SESSIONS`

Returns a list of scheduled sessions from the database that are not yet
completed. Only users of type `presenter` are allowed to call this endpoint.

#### `JOIN_SESSION`

Adds the current user to an existing session identified by the given
session ID. If the user is already in a session (including the given
session), an error is issued.

#### `LEAVE_SESSION`

Removes the user from their current session. If a `userId` is provided and the
caller is the session master, it removes that user instead. If the user is not
in a session, an error is issued.

#### `GET_SESSION_INFO`

Returns a serialised version of the user's current session or the session
that this user is an admin of. If the user is not in any session or not an
admin of any session, an error is issued.

#### `SET_SESSION_STATUS`

Sets the status of the user's current session. Only presenters or session
administrators are allowed to perform this action.

#### `SET_SESSION_PRESENTATION`

Sets the current presentation for the session. Optionally accepts a
`presentationIndex`. Only presenters or session administrators are allowed.

#### `CHANGE_SLIDE`

Changes the current presentation slide. Accepts `slideOffset` or `slideIndex`.
Only presenters or session administrators are allowed.

#### `IS_SHARING`

Sets the `isSharing` flag of the current presentation. Only presenters and
session admins are allowed.

#### `RAISE_HAND`

Sets the raised hand status for the current user in their current session.

#### `CLEAR_RAISED_HAND`

Clears the raised hand status for a user. Users can clear their own status,
while session masters or presenters can clear it for anyone.

#### `GET_RAISED_HANDS`

Returns a list of all users with their raised hand status in the current
session.

#### `IS_SPEAKING`

Sets the `isSpeaking` flag for the current user.

### Bubble Management

#### `CREATE_BUBBLE`

Creates a new conversation bubble within the user's current session. The
creator is added as the owner.

#### `GET_BUBBLE`

Retrieves a serialised version of a bubble given its ID.

#### `JOIN_BUBBLE`

Allows a user to join a bubble if they have a pending invitation.

#### `LEAVE_BUBBLE`

Removes the current user from their current bubble. If the bubble becomes
empty, it is deleted.

#### `LIST_BUBBLES`

Returns a serialised list of active bubbles in the user's current session.

#### `REQUEST_JOIN_BUBBLE`

Allows a user to request to join a specific bubble. The request is sent to
the bubble's owner.

#### `APPROVE_BUBBLE_JOIN_REQUEST`

Allows the owner of a bubble to approve or reject a join request from another
user.

#### `SEND_BUBBLE_INVITATION`

Allows a user to invite another user in the same session to join their
current bubble.

### Shared Objects

#### `REGISTER_SHARED_OBJECT`

Registers a new shared object in the session with an ID, position, and
rotation.

#### `REGISTER_TRIGGER`

Registers a new trigger object in the session with an ID and initial value.

#### `GET_SHARED_OBJECT`

Returns the serialised shared object with the given ID.

#### `GET_TRIGGER`

Returns the serialised trigger object with the given ID.

#### `CLAIM_OWNERSHIP`

Changes ownership of a shared object or trigger to the current user.

#### `SPAWN_SHARED_OBJECT`

Spawns a new shared object with a specific prefab name.

#### `DESTROY_SHARED_OBJECT`

Destroys a shared object with the given ID.

### Data Streams

#### `DECLARE_DATA_STREAM`

Declares a new data stream for the current user by taking stream type and
description as parameters. Returns a serialised list of connection
information and declared data streams.

#### `REGISTER_FOR_DATA_STREAM`

Registers the current user for a data stream from the user with the given
ID and the given stream type.

#### `REMOVE_DATA_STREAM`

Removes a data stream for the current user by taking stream type as
parameter. Returns a serialised list of connection information and
declared data streams after the removal operation

#### `UNREGISTER_FROM_DATA_STREAM`

Unregisters the current user from a remote data stream from the user with
the given ID and the given stream type.

#### `SEND_DATA`

Sends data from the current user to all users in the same session,
provided they are registered for the given stream type.

#### `BROADCAST`

Sends data from the current user to all users in the same session on a
specific channel. Optionally delivers it back to the caller.

### Messaging

#### `SEND_MESSAGE`

Sends a given message from the current user to the user identified by the
given user ID.

#### `SEND_MESSAGE_TO_ALL`

Sends a given message to all users in the user's current session.

#### `GET_MESSAGES`

Returns a serialised version of the last messages (default 100) in the
user's current session.

#### `SEND_SCENE_EVENT_TO_USER`

Sends a scene event from a session master to a regular user.

#### `SEND_SCENE_EVENT_TO_MASTER`

Sends a scene event to the master of the user's current session.

#### `SEND_SCENE_EVENT_TO_ALL`

Sends a scene event from a session master to all users of the session.

### Utility Requests

#### `DUMP_DATA`

Dumps the entire data tree of the orchestrator and sends it to the caller.

#### `GET_NTP_TIME`

Returns the current time as determined using NTP.

#### `GET_ORCHESTRATOR_VERSION`

Returns the version of the orchestrator inside a JSON object.

#### `TERMINATE_ORCHESTRATOR`

Terminates the orchestrator process (if implemented).

## Performance Considerations

### Messaging Concurrency

The orchestrator server has been tested on a desktop machine running inside a
container with concurrent clients accessing an endpoint. The test measures the
roundtrip packet delay on a test socket with concurrent traffic going on in the
background over the course of 5 minutes. The test is performed in a local
network over a standard Ethernet connection.

- Packet delay with unloaded connection:
  - Minimum: 4ms
  - Maximum: 20ms
  - Average: 4.26ms
  - Dropped packets: 0
- Packet delay with 100 concurrent clients:
  - Minimum: 3ms
  - Maximum: 12ms
  - Average: 5.25ms
  - Dropped packets: 0
- Packet delay with 500 concurrent clients:
  - Minimum: 4ms
  - Maximum: 19ms
  - Average: 7ms
  - Dropped packets: 0
- Packet delay with 1000 concurrent clients:
  - Minimum: 3ms
  - Maximum: 23ms
  - Average: 8.95ms
  - Dropped packets: 0
- Packet delay with 2000 concurrent clients:
  - Minimum: 4ms
  - Maximum: 118ms
  - Average: 36ms
  - Dropped packets: 167

With 1000 concurrent clients, the average packet delay on the test socket
remains under 10ms, with no packets on the concurrent connections being
dropped. Starting with 2000 concurrent clients, the average delay on the test
socket climbs climbs to 36ms, with some packets on the background clients
being dropped with 167 of a total of 240543 packets being dropped ~0.069%.

The test was performed on consumer grade hardware over a standard copper-wired
Ethernet connection with a message payload of 50KB.

### Evaluation

In a use case where the Orchestrator is solely responsible for session and user
management as well as transmission of transform events of meshes between
clients, as long as the number of clients stays below 1000, no vertical or
horizontal scaling of the application will be necessary. This implies standard
state management and messaging without transmisison of point clouds over the
Orchestrator.

In case of point cloud transmission, required network bandwidth increases
exponentially. In an instance with two users sharing the same virtual space
represented by full-body point clouds, we require a bandwidth of about 20MB/s
at the Orchestrator.

The Orchestrator offers horizontal scaling through the outsourcing of point
cloud transmission to secondary processes and/or hosts via different protocols
such as raw TCP, DASH or WebRTC. At the moment, these processes are allocated
statically through configuration files in the Orchestrator. Spawning these
processes dynamically and intelligently and allocating clients to them based on
different load characteristics could be an avenue for future work if the use
case requires it.

If no point clouds are transmitted through the orchestrator, this will not be
necessary. Still, it may be worth thinking about replicating the Orchestrator's
internal state across multiple processes through a distributed data store or
some sharding mechanism. The advantage of this would be to better
geographically distribute data and load, should clients want to join the same
session from geographically distant places.

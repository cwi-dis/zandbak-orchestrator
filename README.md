# VR2Gather Orchestrator v2

Orchestrator application to go along with the VR2Gather architecture, handling
user and session management as well as transmission of binary data between
users over the network.

## Running the Orchestrator

The easiest way to run the orchestrator is through Docker. First, make sure you
have Docker and `docker-compose` installed. Rename the file `.env-sample` to
`.env` and adjust the values as needed. Note that if you are on a UNIX system,
this file is likely hidden.

If you set the key `EXTERNAL_HOSTNAME` in `.env` to `dynamic` or leave it unset
completely, the server will try to determine the external hostname using the
request headers when creating a new session. If it fails to do so, an exception
will be raised.

Next, copy the file `config/config-sample/ntp-config.json` to
`config/ntp-config.json` and adjust as needed. The default value for the key
`server`, `nl.pool.ntp.org`, should work for most people, but you may want to
choose one geographically closer to you. Also note that the NTP protocol (or
access to public NTP servers) may be blocked inside some corporate intranets.
In this case, contact your IT department and enquire whether they host an
internal NTP server. Otherwise, opt for the `localtime` option described in the
next paragraph.

Install the required external tools (the Dash and WebRTC SFU's) into `config/packages`.
There are scripts in `external-packages` to download and install the external tools,
see [external-packages/README.md](external-packages/README.md).

You can add multiple NTP servers to this config file, they will be tried in
order until the first one returns a valid response. Adding an entry with the
key-value pair `"server": "localtime"` will return the host's local time
without querying an NTP server.

After setting up the config, simply build and start the container by running

    docker compose up

This will build the container if it hasn't already been built and launch it on
port 8090 (or whatever port you set in `.env`). If this fails, try calling
`docker-compose` instead of `docker compose`. Though this means you are running
an older version of Docker and you should consider upgrading. Also, please
refer to the next section.

### Note for Ubuntu users

It is recommended that you use the latest version of Docker and all associated
tools. The versions found in Ubuntu's official APT repositories are sometimes a
bit outdated, therefore, we recommend you download Docker from Docker's APT
repositories. Follow [this guide](https://docs.docker.com/engine/install/ubuntu/)
to do so.

### External SFUs

The orchestrator can forward binary data (e.g. point clouds) via Socket.IO,
which is also used for all other communication. However, you also have the
option to use an external SFU (*Stream Forwarding Unit*), as long as it is
supported on the client side.  External SFU binaries placed inside a folder
`packages/` in the project root are placed in container during build time into
the folder `/packages`. Keep this in mind when writing SFU config files. The
corresponding config file must be placed into the folder `config/`. See the
file `config/config-sample/webrtc-config.json` as a sample.

If you have changed the configuration or SFU binaries you will have to rebuild
the container, this does not happen automatically:

    docker compose stop
    docker compose build
    docker compose up

## Development

### Building

In order to build the application for development, first make sure you have
`yarn` installed. Then, to install the dependencies and compile the application
run:

    yarn install
    yarn build

### Running

After compiling it, make sure to copy the file `.env-sample` to `.env` and
update the environment variables as needed. Moreover, copy the file
`config/config-sample/ntp-config.json` to `config/ntp-config.json` and change
the hostname/port of your time server if needed. 
Then you may want to install versions of the Dash and WebRTC SFUs that are compatible with your development machine, and ensure that `dash-config.json` and `webrtc-config.json` have the right pathnames.

Finally, the application server
can be launched as follows:

    yarn start

## Utilities

The orchestrator comes with a series of utilities which may come in handy for
development and debugging. They are Node.js scripts and located in the
`scripts/` folder.

### Reading logs remotely

If the property `LOG_SERVER` is set in `.env`, all Orchestrator log messages
are forwarded via the Orchestrator's Socket.IO connection. To read them
remotely, you can use the `logreader` script, which takes the Orchestrator's
hostname (and optional port) as command line argument:

    node scripts/logreader.js localhost:8090

### Dump data tree

In order to dump the entire data tree of an orchestrator instance, you can use
the `dump` script, passing in the hostname of an orchestrator instance:

    node scripts/dump.js localhost:8090

### Terminate orchestrator

In order to restart/terminate a remote orchestrator instance, use the
`terminate` script, passing along the hostname of an instance:

    node scripts/terminate.js localhost:8090

If the orchestrator instance is running inside a Docker container using the
supplied `docker-compose.yml` configuration, the Docker daemon will relaunch
the container immediately. All data stored in the orchestrator at the time of
termination will be lost.

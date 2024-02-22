# VR2Gather Orchestrator v2

Orchestrator application to go along with the VR2Gather architecture, handling
user and session management as well as transmission of binary data between
users over the network.

## Running the Orchestrator

The easiest way to run the orchestrator is through Docker. First, make sure you
have Docker and `docker-compose` installed. Then, simply build and start the
container by running

    docker compose up

This will build the container if it hasn't already been build and launch it on
port 8090.


## Development

### Building

In order to build the application for development, first make sure you have
`yarn` installed. Then, to install the dependencies and compile the application
run:

    yarn install
    yarn build

### Running

After compiling it, make sure to copy the file `.env-sample` to `.env` and
update the environment variables as needed. Moreover, check the file
`config/ntp-config.json` and change the hostname/port of your time server if
needed. Then, the application server can be launched as follows:

    yarn start

### Reading logs remotely

If the property `LOG_SERVER` is set in `.env`, all Orchestrator log messages
are forwarded via the Orchestrator's Socket.IO connection. To read them
remotely, you can use the `logreader` script, which takes the Orchestrator's
hostname as command line argument:

    node logreader localhost


![](views/orchestrator_logo.png)

Orchestrator application for the Zandbak framework, handling user and session
management as well as transmission of binary data between users over the
network. This project is a descendant of the VR2Gather Orchestrator, adapting
it to the needs of the INDUX-R project. It is intended to work in tandem with
the [Zandbak Client Library](https://github.com/cwi-dis/zandbak-client) for
Unity.

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

You can add multiple NTP servers to this config file, they will be tried in
order until the first one returns a valid response. Adding an entry with the
key-value pair `"server": "localtime"` will return the host's local time
without querying an NTP server.

After setting up the config, simply build and start the container by running

    docker compose up

This will build the container if it hasn't already been built and launch it on
port 8090 (or whatever port you set in `.env`). It will also set up a MongoDB
database for storing user accounts and scheduled sessions.

If this fails, try calling `docker-compose` instead of `docker compose`. Though
this means you are running an older version of Docker and you should consider
upgrading. Also, please refer to the next section.

### Note for Ubuntu users

It is recommended that you use the latest version of Docker and all associated
tools. The versions found in Ubuntu's official APT repositories are sometimes a
bit outdated, therefore, we recommend you download Docker from Docker's APT
repositories. Follow [this guide](https://docs.docker.com/engine/install/ubuntu/)
to do so.

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

Finally, the application server
can be launched as follows:

    yarn start

## Endpoint documentation

The Orchestrator is meant as a orchestration and session management engine and
goes together with the Zandbak Client Library for Unity. This is intended to
be the main mode of interaction with it. However, all socket endpoints are
documented in the file [ENDPOINTS.md](ENDPOINTS.md) in this repository.

## Plugin System

The Zandbak Orchestrator features a plugin system that allows developers to
extend its functionality. Plugins can react to system events, access the
internal state of the orchestrator, and programmatically interact with
endpoints.

### Creating a Plugin

To create a plugin, create a new TypeScript or JavaScript file in the
`plugins/` directory. Your plugin must implement the `Plugin` interface defined
in `app/plugin/plugin.ts`.

Example:

```typescript
import Orchestrator from "../app/orchestrator";
import { Plugin } from "../app/plugin/plugin";
import logger from "../logger";

export default class MyPlugin implements Plugin {
  public name = "MyPlugin";
  public description = "A simple example plugin.";
  public enabled = true;

  public init(orchestrator: Orchestrator) {
    logger.info(this.name, "Plugin initialized!");

    // Create a virtual user for the plugin to interact with endpoints
    const pluginUser = orchestrator.pluginManager.createPluginUser("MyPluginUser");

    // Subscribe to orchestrator events
    orchestrator.on("SESSION_CREATED", (sessionData) => {
      logger.info(this.name, `New session created: ${sessionData.sessionId}`);
      
      // Use the Plugin API to call endpoints
      pluginUser.api.joinSession(sessionData.sessionId).then(() => {
        logger.info(this.name, "Joined session successfully");
      });
    });
  }

  public destroy() {
    logger.info(this.name, "Plugin destroyed!");
  }
}
```

### Plugin API

The `PluginUser` provides an `api` property which contains typed methods for
all available endpoints (defined in `app/plugin/plugin_api.ts`). This allows
plugins to perform actions such as joining sessions, spawning objects, or
sending broadcasts using a clean, Promise-based interface.

### Running with Plugins

Plugins are automatically discovered and loaded from the `plugins/` directory
during startup. When running the orchestrator using `yarn start`, it uses `tsx`
to support loading TypeScript plugins directly without a separate compilation
step. Note that only plugins with the `enabled` property set to true are
actually started.

If you add or change a plugin, you have to restart the server in order for your
changes to take effect.

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

## Admin interface

If you set the environment variables `ADMIN_USER` and `ADMIN_PASSWORD` in your
`.env`, a web-based debugging tool will be enabled. This interface allows you
to inspect the current state tree and log messages through a web interface.
The debugging interface can be accessed by opening `http://localhost:8090/admin`
(or whatever host/port the Orchestrator is running on) in a web browser.

Leaving these environment variables unset disables the web admin interface.

## Acknowledgements

This work is supported by the European Union as part of the Horizon Europe
Framework Program under grant agreement No. 101135556 (INDUX-R).

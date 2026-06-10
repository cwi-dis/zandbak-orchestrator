import Orchestrator from "../app/orchestrator";
import logger from "../logger";
import { Plugin } from "../app/plugin/plugin";

export default class WelcomePlugin implements Plugin {
  public name = "WelcomePlugin";
  public description = "An example plugin that automatically joins sessions and sends a welcome message.";
  public enabled = true;

  public init(orchestrator: Orchestrator) {
    const pluginUser = orchestrator.pluginManager.createPluginUser("spectator");
    const { api } = pluginUser;

    orchestrator.on("SESSION_CREATED", async (sessionData: any) => {
      logger.info("EXAMPLE_PLUGIN", `Session created: ${sessionData.sessionName}`);
      const sessionId = sessionData.sessionId;

      // Call JOIN_SESSION endpoint via the plugin API
      const response = await api.joinSession(sessionId);

      if (response.error === 0) {
        logger.info("EXAMPLE_PLUGIN", `Joined session ${sessionId}`);
        const session = orchestrator.getSession(sessionId);

        session?.on("USER_JOINED_SESSION", (user) => {
          setTimeout(() => {
            api.sendMessageToAll(`Welcome to '${session.name}' user '${user.userData.userName}'`);
          }, 1000);
        });
      } else {
        logger.error("EXAMPLE_PLUGIN", `Failed to join session: ${response.message}`);
      }
    });
  }
}

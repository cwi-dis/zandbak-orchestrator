import Orchestrator from "../app/orchestrator";
import logger from "../logger";
import { Plugin } from "../app/plugin/plugin";

export default class ExamplePlugin implements Plugin {
  public name = "ExamplePlugin";
  public description = "An example plugin that automatically joins sessions and spawns objects.";

  public init(orchestrator: Orchestrator) {
    const pluginUser = orchestrator.pluginManager.createPluginUser("ExamplePluginUser");
    const { api } = pluginUser;

    orchestrator.on("SESSION_CREATED", async (sessionData: any) => {
      logger.info("EXAMPLE_PLUGIN", `Session created: ${sessionData.sessionName}`);
      const sessionId = sessionData.sessionId;

      // Call JOIN_SESSION endpoint via the plugin API
      const response = await api.joinSession(sessionId);

      if (response.error === 0) {
        logger.info("EXAMPLE_PLUGIN", `Joined session ${sessionId}`);

        // Spawn a shared object
        const spawnResponse = await pluginUser.api.spawnSharedObject(
          "cube",
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 0, w: 1 },
          "Cube"
        );
        logger.info("EXAMPLE_PLUGIN", `Spawned cube with ID ${spawnResponse.body.id}`);
      } else {
        logger.error("EXAMPLE_PLUGIN", `Failed to join session: ${response.message}`);
      }
    });
  }
}

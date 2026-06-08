import Orchestrator from "../orchestrator";

export interface Plugin {
  /**
   * The name of the plugin.
   */
  name: string;

  /**
   * Optional description of the plugin.
   */
  description?: string;

  /**
   * Optional version of the plugin.
   */
  version?: string;

  /**
   * Initialization method called by the PluginManager when the plugin is loaded.
   * @param orchestrator The orchestrator instance.
   */
  init(orchestrator: Orchestrator): void;

  /**
   * Optional cleanup method called when the orchestrator is shutting down.
   */
  destroy?(): void;
}

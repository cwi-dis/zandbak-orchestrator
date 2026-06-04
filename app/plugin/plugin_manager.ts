import * as fs from "fs";
import * as path from "path";

import Orchestrator from "../orchestrator";
import logger from "../../logger";

import installConnectionHandlers from "../../endpoints/connection_management";
import installSessionHandlers from "../../endpoints/session_management";
import installUtilHandlers from "../../endpoints/util";
import installUserDataHandlers from "../../endpoints/user_data";
import installSceneEventHandlers from "../../endpoints/scene_events";
import installStreamHandlers from "../../endpoints/data_streams";
import installBubbleHandlers from "../../endpoints/bubble_management";
import installSharedObjectHandlers from "../../endpoints/shared_objects";
import PluginUser from "./plugin_user";
import { Plugin } from "./plugin";

class PluginManager {
  private plugins: Plugin[] = [];

  constructor(private orchestrator: Orchestrator) {}

  public createPluginUser(name: string): PluginUser {
    const user = new PluginUser(name);
    this.orchestrator.addUser(user);

    // Install handlers
    installUtilHandlers(this.orchestrator, user.socket as any);
    installConnectionHandlers(this.orchestrator, user);
    installSessionHandlers(this.orchestrator, user);
    installUserDataHandlers(this.orchestrator, user);
    installSceneEventHandlers(user);
    installStreamHandlers(user);
    installBubbleHandlers(user);
    installSharedObjectHandlers(user);

    return user;
  }

  public async loadPlugins() {
    const pluginsDir = path.join(process.cwd(), "plugins");

    if (!fs.existsSync(pluginsDir)) {
      try {
        fs.mkdirSync(pluginsDir);
      } catch (err) {
        logger.error("PLUGIN_MANAGER", "Failed to create plugins directory", err);
      }
      return;
    }

    const files = fs.readdirSync(pluginsDir);

    for (const file of files) {
      if (file.endsWith(".js") || (file.endsWith(".ts") && !file.endsWith(".d.ts"))) {
        await this.loadPlugin(path.join(pluginsDir, file));
      }
    }
  }

  private async loadPlugin(filePath: string) {
    try {
      // Use absolute path with file:// protocol for import() in Node.js
      // We use eval('import(...)') to prevent Webpack from trying to bundle the dynamic import
      const pluginModule = await (0, eval)(`import("file://${filePath}")`);
      let PluginClass = pluginModule.default || pluginModule;

      // Handle potential double default wrapping from interop
      while (PluginClass && PluginClass.default && typeof PluginClass.init !== "function") {
        PluginClass = PluginClass.default;
      }

      let plugin: any;
      if (typeof PluginClass === "function") {
        try {
          // Check if it's a class (constructor) or a factory function
          if (PluginClass.prototype && PluginClass.prototype.constructor === PluginClass) {
            plugin = new PluginClass();
          } else {
            plugin = PluginClass(this.orchestrator);
          }
        } catch (e) {
          logger.debug("PLUGIN_MANAGER", `Failed to instantiate plugin class from ${filePath}, using as is: ${e}`);
          plugin = PluginClass;
        }
      } else {
        plugin = PluginClass;
      }

      if (this.isPlugin(plugin)) {
        plugin.init(this.orchestrator);
        this.plugins.push(plugin);
        logger.info("PLUGIN_MANAGER", `Loaded plugin: ${plugin.name}`);
      } else {
        logger.warn("PLUGIN_MANAGER", `Module at ${filePath} does not implement Plugin interface.`);
        logger.debug("PLUGIN_MANAGER", "Plugin object:", plugin);
      }
    } catch (err) {
      logger.error("PLUGIN_MANAGER", `Failed to load plugin from ${filePath}:`, err);
    }
  }

  private isPlugin(obj: any): obj is Plugin {
    return obj && typeof obj.init === "function" && typeof obj.name === "string";
  }
}

export default PluginManager;

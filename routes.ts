import { Router } from "express";
import basicAuth from "express-basic-auth";
import logger from "./logger";

import { ORCHESTRATOR_VERSION, getFromEnvironment } from "./util";

const router = Router();

try {
  const [ ADMIN_USER, ADMIN_PASSWORD ] = getFromEnvironment(["ADMIN_USER", "ADMIN_PASSWORD"]);

  router.use(basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASSWORD},
    challenge: true
  }));

  router.get("/admin", (_, res) => {
    res.render("admin", {
      orchestrator_version: ORCHESTRATOR_VERSION
    });
  });

  logger.info("Web admin interface enabled");
} catch (err) {
  logger.error("Failed to read admin credentials from environment variables. Cannot set up web admin interface.", err);
}

export default router;

const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/node_modules/**",
    "!**/test/**",
    "!**/bin/**",
    "!**/dist/**",
    "!jest.config.js",
    "!webpack.config.js",
    "!eslint.config.mjs",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
};
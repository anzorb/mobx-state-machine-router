/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  rootDir: ".",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@mobx-state-machine-router/core$": "<rootDir>/packages/core/src/index.ts",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "./packages/**/src/**/*.ts",
    "!**/*.test.ts",
    "!**/dist/**/*",
    "!**/*.d.ts",
  ],
  coverageDirectory: "./coverage",
  coverageReporters: ["lcov", "text", "cobertura"],
  testRegex: ["./packages/.*/.*\\.(test)\\.ts$"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.module\\.css$": "<rootDir>/src/__mocks__/styleMock.js",
    "\\.css$": "<rootDir>/src/__mocks__/styleMock.js",
  },
  setupFiles: ["<rootDir>/src/__mocks__/setupTests.js"],
};

module.exports = config;

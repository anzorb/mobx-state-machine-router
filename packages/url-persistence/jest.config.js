module.exports = {
  collectCoverage: true,


  collectCoverageFrom: [
    './package*/**/*.{js,ts}',
    '!**/*.test.{js,ts}',
    '!**/lib/**/*',
    '!**/mock.js'
  ],

  coverageDirectory: './coverage',

  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },

  coverageReporters: ['lcov', 'cobertura'],

  preset: 'ts-jest',

  rootDir: __dirname,

  runner: '@jest-runner/electron',
  testEnvironment: '@jest-runner/electron/environment',
  testURL: 'http://localhost',

  testRegex: ['./package.*/.*\\.(test)\\.ts$']
};

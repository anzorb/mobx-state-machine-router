module.exports = {
  collectCoverage: true,


  collectCoverageFrom: [
    './package*/**/*.{js,ts}',
    '!**/*.test.{js,ts}',
    '!**/lib/**/*',
    '!**/mock.js',
    '!**/dist/**/*',
    '!**/**/jest.config.js',
  ],

  coverageDirectory: './coverage',

  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },

  coverageReporters: ['lcov', 'cobertura'],

  preset: 'ts-jest',

  rootDir: __dirname,
  testEnvironment: 'jsdom',
  // runner: '@jest-runner/electron',
  // testEnvironment: '@jest-runner/electron/environment',
  testURL: 'http://localhost',

  testRegex: ['./package.*/.*\\.(test)\\.ts$']
};

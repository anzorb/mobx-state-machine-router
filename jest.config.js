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

  testEnvironment: 'jsdom',
  testURL: 'http://localhost',

  testRegex: ['./package.*/.*\\.(test)\\.ts$']
};

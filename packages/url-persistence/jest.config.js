module.exports = {
  collectCoverageFrom: [
    '**/packages/**/src/**/*.{js,jsx,ts,tsx}',
    '!**/packages/**/*.d.ts',
    '!**/packages/**/index.js'
  ],
  resolver: 'jest-pnp-resolver',
  testMatch: ['**/packages/**/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { cwd: __dirname }]
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'],
  moduleDirectories: ['node_modules', 'packages'],
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node'
  ],
  reporters: ['default']
};

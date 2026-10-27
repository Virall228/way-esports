module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['**/tests/seo/**/*.test.ts'],
  // These HTTP contract tests use model fixtures and do not require a Mongo daemon.
  setupFilesAfterEnv: [],
  forceExit: false,
  testTimeout: 15000,
};

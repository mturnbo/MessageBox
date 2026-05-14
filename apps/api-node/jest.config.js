export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^#models/(.*)$': '<rootDir>/src/models/$1',
    '^#controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^#config/(.*)$': '<rootDir>/src/config/$1',
    '^#utils/(.*)$': '<rootDir>/src/utils/$1',
    '^#middlewares/(.*)$': '<rootDir>/src/middlewares/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  injectGlobals: true,
};

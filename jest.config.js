module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/web/'],
  moduleFileExtensions: ['ts', 'js'],
  setupFiles: ['<rootDir>/src/api/__tests__/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/api/__tests__/setup.ts'],
};

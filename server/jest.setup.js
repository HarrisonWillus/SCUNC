// Jest setup file for server tests
require('dotenv').config({ path: '.env.test' });

// Mock console.log during tests to reduce noise
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only log if it's a test-related message or error
  if (args.some(arg => typeof arg === 'string' && (arg.includes('PASS') || arg.includes('FAIL') || arg.includes('ERROR')))) {
    originalConsoleLog(...args);
  }
};

// Set up test database or mock environment
process.env.NODE_ENV = 'test';

// Global test helpers
global.testHelper = {
  // Add any global test utilities here
};

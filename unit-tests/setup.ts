// Jest setup file for Boston-style testing
import 'reflect-metadata';

// Global test utilities and mocks can be set up here
// Example: Mock external services, set up test databases, etc.

// Boston-style testing helpers
global.describe = describe;
global.context = describe;
global.it = it;
global.test = it;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;

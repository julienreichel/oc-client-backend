// Jest setup for E2E tests
// Increases test stability in CI environments

// Extend Jest timeout for CI environment
if (process.env.CI) {
  jest.setTimeout(60000); // 60 seconds for CI
} else {
  jest.setTimeout(30000); // 30 seconds for local development
}

// Suppress Prisma query engine output in tests unless debugging
if (!process.env.DEBUG) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter out Prisma query engine logs during tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Query engine') || 
       args[0].includes('prisma:query') ||
       args[0].includes('prisma:engine'))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in tests, just log
});
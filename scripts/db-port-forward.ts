#!/usr/bin/env ts-node

import { spawn } from 'child_process';

/**
 * Simple port-forward script for connecting to cluster PostgreSQL database.
 *
 * Usage: npm run db:port-forward
 * This forwards localhost:5432 -> oc-client/pg:5432
 */

console.log('🔄 Starting port-forward to cluster PostgreSQL...');
console.log('   Namespace: oc-client');
console.log('   Service: pg');
console.log('   Port mapping: localhost:5432 -> pg:5432');
console.log('');

// Check if kubectl is available
const checkKubectl = spawn('kubectl', ['version', '--client'], {
  stdio: 'pipe',
});

checkKubectl.on('error', () => {
  console.error(
    '❌ kubectl not found. Please install kubectl and configure access to your cluster.',
  );
  process.exit(1);
});

checkKubectl.on('exit', (code) => {
  if (code !== 0) {
    console.error(
      '❌ kubectl not working properly. Please check your cluster configuration.',
    );
    process.exit(1);
  }

  // Start the actual port-forward
  console.log('✅ kubectl found, starting port-forward...');

  const portForward = spawn(
    'kubectl',
    ['port-forward', '-n', 'oc-client', 'svc/pg', '5432:5432'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  portForward.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    if (output.includes('Forwarding from')) {
      console.log('✅ Port-forward established successfully');
      console.log('   Database is now accessible at localhost:5432');
      console.log('   Press Ctrl+C to stop port-forwarding');
    }
  });

  portForward.stderr?.on('data', (data: Buffer) => {
    const error = data.toString();
    console.error('❌ Port-forward error:', error);
  });

  portForward.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ kubectl port-forward exited with code ${code}`);
      process.exit(1);
    } else {
      console.log('🔴 Port-forward stopped');
    }
  });

  portForward.on('error', (error) => {
    console.error('❌ Failed to start kubectl:', error.message);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping port-forward...');
    portForward.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping port-forward...');
    portForward.kill('SIGTERM');
    process.exit(0);
  });
});

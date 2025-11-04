#!/usr/bin/env ts-node

import { spawn, ChildProcess } from 'child_process';
import * as process from 'process';

/**
 * Port-forward script for connecting to cluster PostgreSQL database during testing.
 *
 * This script establishes a kubectl port-forward connection to the PostgreSQL service
 * running in the oc-client namespace, allowing local development and testing against
 * the cluster database.
 *
 * Usage:
 *   npm run db:port-forward        # Start port-forward in background
 *   npm run test:integration       # Run integration tests against cluster DB
 *
 * Environment:
 *   DATABASE_URL should be set to: postgresql://username:password@localhost:5432/dbname
 */

class DatabasePortForward {
  private process: ChildProcess | null = null;
  private readonly namespace = 'oc-client';
  private readonly service = 'pg';
  private readonly localPort = 5432;
  private readonly remotePort = 5432;

  constructor() {
    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async start(): Promise<void> {
    console.log('🔄 Starting port-forward to cluster PostgreSQL...');
    console.log(`   Namespace: ${this.namespace}`);
    console.log(`   Service: ${this.service}`);
    console.log(
      `   Port mapping: localhost:${this.localPort} -> ${this.service}:${this.remotePort}`,
    );

    return new Promise((resolve, reject) => {
      this.process = spawn(
        'kubectl',
        [
          'port-forward',
          '-n',
          this.namespace,
          `svc/${this.service}`,
          `${this.localPort}:${this.remotePort}`,
        ],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Forwarding from')) {
          console.log('✅ Port-forward established successfully');
          console.log(
            '   You can now run integration tests with DATABASE_URL pointing to localhost:5432',
          );
          resolve();
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        console.error('❌ Port-forward error:', error);
        if (error.includes('unable to forward port')) {
          reject(
            new Error(
              'Failed to establish port-forward. Ensure kubectl is configured and the service exists.',
            ),
          );
        }
      });

      this.process.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`kubectl port-forward exited with code ${code}`));
        } else {
          console.log('🔴 Port-forward stopped');
        }
      });

      this.process.on('error', (error) => {
        console.error('❌ Failed to start kubectl:', error.message);
        reject(error);
      });
    });
  }

  stop(): void {
    if (this.process) {
      console.log('🛑 Stopping port-forward...');
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  async checkClusterConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const checkProcess = spawn(
        'kubectl',
        ['get', 'svc', '-n', this.namespace, this.service],
        {
          stdio: 'pipe',
        },
      );

      checkProcess.on('exit', (code) => {
        resolve(code === 0);
      });

      checkProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}

async function main() {
  const portForward = new DatabasePortForward();

  try {
    // Check if kubectl and cluster service are available
    const clusterAvailable = await portForward.checkClusterConnection();

    if (!clusterAvailable) {
      console.error('❌ Cannot connect to cluster or service not found.');
      console.error(
        '   Ensure kubectl is configured and the PostgreSQL service exists in oc-client namespace.',
      );
      process.exit(1);
    }

    await portForward.start();

    // Keep the process running
    console.log('✨ Port-forward is active. Press Ctrl+C to stop.');

    // Keep process alive
    process.stdin.resume();
  } catch (error) {
    console.error('❌ Port-forward failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { DatabasePortForward };

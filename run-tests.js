#!/usr/bin/env node

/**
 * SOPMaker Complete Test Runner
 * Runs all tests before code push
 * 
 * Usage: npm run test
 */

const { spawn } = require('child_process');
const TestBattery = require('./test-battery');

class TestRunner {
    constructor() {
        this.serverProcess = null;
        this.testResults = {
            static: false,
            integration: false,
            server: false
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        
        const color = colors[type] || colors.info;
        console.log(`${color}[${timestamp}] ${type.toUpperCase()}: ${message}${colors.reset}`);
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.log('Starting test server...');
            
            this.serverProcess = spawn('node', ['server.js'], {
                stdio: 'pipe',
                env: { ...process.env, NODE_ENV: 'test' }
            });

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Server running on port 3000') || output.includes('listening on port 3000')) {
                    this.log('Test server started successfully');
                    this.testResults.server = true;
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                this.log(`Server error: ${error}`, 'error');
            });

            this.serverProcess.on('error', (error) => {
                this.log(`Failed to start server: ${error.message}`, 'error');
                reject(error);
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.testResults.server) {
                    this.log('Server startup timeout', 'error');
                    reject(new Error('Server startup timeout'));
                }
            }, 10000);
        });
    }

    async stopServer() {
        if (this.serverProcess) {
            this.log('Stopping test server...');
            this.serverProcess.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await new Promise(resolve => {
                this.serverProcess.on('exit', () => {
                    this.log('Test server stopped');
                    resolve();
                });
                
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.serverProcess && !this.serverProcess.killed) {
                        this.serverProcess.kill('SIGKILL');
                        resolve();
                    }
                }, 5000);
            });
        }
    }

    async runStaticTests() {
        this.log('🔍 Running static analysis tests...');
        
        try {
            const testBattery = new TestBattery();
            await testBattery.runAllTests();
            this.testResults.static = true;
            return true;
        } catch (error) {
            this.log(`Static tests failed: ${error.message}`, 'error');
            return false;
        }
    }

    async runIntegrationTests() {
        this.log('🌐 Running integration tests...');
        
        try {
            const IntegrationTestSuite = require('./test-integration');
            const testSuite = new IntegrationTestSuite();
            const result = await testSuite.runAllTests();
            this.testResults.integration = result;
            return result;
        } catch (error) {
            this.log(`Integration tests failed: ${error.message}`, 'error');
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting SOPMaker Complete Test Suite...');
        this.log('This will run static analysis, start server, and run integration tests');
        
        let allPassed = true;

        try {
            // Step 1: Run static tests
            const staticResult = await this.runStaticTests();
            if (!staticResult) {
                this.log('❌ Static tests failed - stopping test run', 'error');
                return false;
            }

            // Step 2: Start server for integration tests
            await this.startServer();

            // Step 3: Run integration tests
            const integrationResult = await this.runIntegrationTests();
            if (!integrationResult) {
                allPassed = false;
            }

        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
            allPassed = false;
        } finally {
            // Always stop server
            await this.stopServer();
        }

        // Final results
        this.log('\n📊 COMPLETE TEST RESULTS:');
        this.log(`Static Analysis: ${this.testResults.static ? '✅ PASSED' : '❌ FAILED'}`);
        this.log(`Server Startup: ${this.testResults.server ? '✅ PASSED' : '❌ FAILED'}`);
        this.log(`Integration Tests: ${this.testResults.integration ? '✅ PASSED' : '❌ FAILED'}`);

        if (allPassed && this.testResults.static && this.testResults.server && this.testResults.integration) {
            this.log('\n🎉 ALL TESTS PASSED - SAFE TO PUSH TO PRODUCTION! 🎉', 'success');
            return true;
        } else {
            this.log('\n💥 TESTS FAILED - DO NOT PUSH TO PRODUCTION! 💥', 'error');
            this.log('Fix the failing tests before pushing code.', 'error');
            return false;
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Run tests if this file is executed directly
if (require.main === module) {
    const testRunner = new TestRunner();
    testRunner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = TestRunner;

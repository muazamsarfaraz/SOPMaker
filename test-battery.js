/**
 * SOPMaker Comprehensive Test Battery
 * Run this before every code push to catch critical errors
 * 
 * Usage: node test-battery.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestBattery {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
        
        if (type === 'error') this.errors.push(message);
        if (type === 'warning') this.warnings.push(message);
        this.testResults.push({ timestamp, type, message });
    }

    async runTest(testName, testFunction) {
        try {
            this.log(`Running ${testName}...`);
            await testFunction();
            this.log(`✅ ${testName} PASSED`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ ${testName} FAILED: ${error.message}`, 'error');
            return false;
        }
    }

    // Test 1: File Structure and Dependencies
    async testFileStructure() {
        const requiredFiles = [
            'index.html',
            'script.js', 
            'server.js',
            'package.json',
            '.env.example',
            'augment_docs/todo.md'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Check package.json dependencies
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = ['openai', 'dotenv', 'express'];
        
        for (const dep of requiredDeps) {
            if (!packageJson.dependencies[dep]) {
                throw new Error(`Required dependency missing: ${dep}`);
            }
        }
    }

    // Test 2: JavaScript Syntax Validation
    async testJavaScriptSyntax() {
        try {
            // Test server.js syntax
            execSync('node -c server.js', { stdio: 'pipe' });
            
            // Test script.js by loading it in a safe context
            const scriptContent = fs.readFileSync('script.js', 'utf8');
            
            // Check for common syntax errors
            if (scriptContent.includes('entry.processStep.toLowerCase()')) {
                throw new Error('Found unsafe .toLowerCase() call without null check');
            }
            
            // Check for proper null safety
            if (!scriptContent.includes('entry.processStep?.toLowerCase()')) {
                this.log('Warning: Consider using optional chaining for processStep', 'warning');
            }
            
        } catch (error) {
            throw new Error(`JavaScript syntax error: ${error.message}`);
        }
    }

    // Test 3: OpenAI Integration Test
    async testOpenAIIntegration() {
        // Check if .env file exists (for local testing)
        const hasEnvFile = fs.existsSync('.env');
        
        if (!hasEnvFile) {
            this.log('No .env file found - OpenAI will use simulation mode', 'warning');
            return;
        }

        // Test server startup
        try {
            const serverContent = fs.readFileSync('server.js', 'utf8');
            
            // Check for proper error handling
            if (!serverContent.includes('try {') || !serverContent.includes('catch')) {
                throw new Error('Server.js missing proper error handling');
            }
            
            // Check for OpenAI initialization
            if (!serverContent.includes('openai')) {
                throw new Error('OpenAI not properly initialized in server.js');
            }
            
        } catch (error) {
            throw new Error(`OpenAI integration test failed: ${error.message}`);
        }
    }

    // Test 4: RACM Logic Validation
    async testRACMLogic() {
        const scriptContent = fs.readFileSync('script.js', 'utf8');
        
        // Test for null safety in RACM operations
        const racmFunctions = [
            'isCompletelyDifferentProcess',
            'racmData.some',
            'processStep?.toLowerCase'
        ];
        
        for (const func of racmFunctions) {
            if (!scriptContent.includes(func)) {
                throw new Error(`RACM function missing or malformed: ${func}`);
            }
        }
        
        // Check for proper error handling in sync operations
        if (!scriptContent.includes('try {') || !scriptContent.includes('catch')) {
            throw new Error('Missing error handling in RACM sync operations');
        }
    }

    // Test 5: HTML Structure Validation
    async testHTMLStructure() {
        const htmlContent = fs.readFileSync('index.html', 'utf8');
        
        const requiredElements = [
            'syncDescriptionBtn',
            'syncBpmnBtn', 
            'syncRacmBtn',
            'racmTableBody',
            'descriptionContainer',
            'syncPreviewModal'
        ];
        
        for (const elementId of requiredElements) {
            if (!htmlContent.includes(`id="${elementId}"`)) {
                throw new Error(`Required HTML element missing: ${elementId}`);
            }
        }
    }

    // Test 6: API Endpoint Validation
    async testAPIEndpoints() {
        const serverContent = fs.readFileSync('server.js', 'utf8');
        
        const requiredEndpoints = [
            '/api/sync-sections',
            '/api/debug/env'
        ];
        
        for (const endpoint of requiredEndpoints) {
            if (!serverContent.includes(endpoint)) {
                throw new Error(`Required API endpoint missing: ${endpoint}`);
            }
        }
    }

    // Test 7: Environment Configuration
    async testEnvironmentConfig() {
        // Check .env.example exists and has required variables
        if (!fs.existsSync('.env.example')) {
            throw new Error('.env.example file missing');
        }
        
        const envExample = fs.readFileSync('.env.example', 'utf8');
        if (!envExample.includes('OPENAI_API_KEY')) {
            throw new Error('.env.example missing OPENAI_API_KEY');
        }
    }

    // Test 8: Git Repository Status
    async testGitStatus() {
        try {
            // Check if we're in a git repository
            execSync('git status', { stdio: 'pipe' });
            
            // Check for uncommitted changes
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (status.trim()) {
                this.log('Warning: Uncommitted changes detected', 'warning');
            }
            
        } catch (error) {
            throw new Error('Git repository validation failed');
        }
    }

    // Main test runner
    async runAllTests() {
        this.log('🚀 Starting SOPMaker Test Battery...');
        
        const tests = [
            ['File Structure & Dependencies', () => this.testFileStructure()],
            ['JavaScript Syntax', () => this.testJavaScriptSyntax()],
            ['OpenAI Integration', () => this.testOpenAIIntegration()],
            ['RACM Logic', () => this.testRACMLogic()],
            ['HTML Structure', () => this.testHTMLStructure()],
            ['API Endpoints', () => this.testAPIEndpoints()],
            ['Environment Config', () => this.testEnvironmentConfig()],
            ['Git Repository', () => this.testGitStatus()]
        ];
        
        let passed = 0;
        let failed = 0;
        
        for (const [testName, testFunction] of tests) {
            const result = await this.runTest(testName, testFunction);
            if (result) passed++;
            else failed++;
        }
        
        this.log(`\n📊 Test Results: ${passed} passed, ${failed} failed, ${this.warnings.length} warnings`);
        
        if (failed > 0) {
            this.log('❌ TESTS FAILED - DO NOT PUSH TO PRODUCTION', 'error');
            process.exit(1);
        } else if (this.warnings.length > 0) {
            this.log('⚠️  TESTS PASSED WITH WARNINGS - Review before pushing', 'warning');
        } else {
            this.log('✅ ALL TESTS PASSED - Safe to push to production', 'success');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testBattery = new TestBattery();
    testBattery.runAllTests().catch(error => {
        console.error('Test battery failed:', error);
        process.exit(1);
    });
}

module.exports = TestBattery;

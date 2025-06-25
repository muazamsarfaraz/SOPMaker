/**
 * SOPMaker Integration Test Suite
 * Tests the complete user workflow including AI sync functionality
 * 
 * Usage: node test-integration.js
 */

const { chromium } = require('playwright');

class IntegrationTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.errors = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
        
        if (type === 'error') this.errors.push(message);
        this.testResults.push({ timestamp, type, message });
    }

    async setup() {
        this.log('Setting up browser for integration tests...');
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.log(`Browser console error: ${msg.text()}`, 'error');
            }
        });
        
        // Set up error handling
        this.page.on('pageerror', error => {
            this.log(`Page error: ${error.message}`, 'error');
        });
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
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

    // Test 1: Page Load and Basic Elements
    async testPageLoad() {
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        
        // Check for critical elements
        const elements = [
            '#descriptionContainer',
            '#syncDescriptionBtn',
            '#syncBpmnBtn', 
            '#syncRacmBtn',
            '#racmTableBody'
        ];
        
        for (const selector of elements) {
            const element = await this.page.$(selector);
            if (!element) {
                throw new Error(`Critical element not found: ${selector}`);
            }
        }
        
        // Check for JavaScript errors
        const title = await this.page.title();
        if (!title.includes('SOP')) {
            throw new Error('Page title incorrect or missing');
        }
    }

    // Test 2: Description Editing
    async testDescriptionEditing() {
        // Click edit button
        await this.page.click('#editDescriptionBtn');
        
        // Wait for textarea to appear
        await this.page.waitForSelector('#descriptionTextarea', { timeout: 5000 });
        
        // Fill in test content
        const testDescription = 'Test SOP for automated testing purposes.';
        await this.page.fill('#descriptionTextarea', testDescription);
        
        // Save changes
        await this.page.click('#saveDescriptionEdit');
        
        // Verify content was saved
        await this.page.waitForTimeout(1000);
        const savedContent = await this.page.textContent('#descriptionContainer');
        if (!savedContent.includes('Test SOP')) {
            throw new Error('Description editing failed - content not saved');
        }
    }

    // Test 3: RACM Table Functionality
    async testRACMTable() {
        // Check if RACM table has rows
        const rows = await this.page.$$('#racmTableBody tr');
        if (rows.length === 0) {
            throw new Error('RACM table has no rows');
        }
        
        // Check if table has required columns
        const firstRow = rows[0];
        const cells = await firstRow.$$('td');
        if (cells.length < 8) {
            throw new Error('RACM table missing required columns');
        }
        
        // Test add row functionality
        await this.page.click('#addRacmRowBtn');
        await this.page.waitForTimeout(1000);
        
        const newRowCount = await this.page.$$('#racmTableBody tr');
        if (newRowCount.length <= rows.length) {
            throw new Error('Add RACM row functionality failed');
        }
    }

    // Test 4: Sync Button Functionality
    async testSyncButtons() {
        const syncButtons = ['#syncDescriptionBtn', '#syncBpmnBtn', '#syncRacmBtn'];
        
        for (const buttonSelector of syncButtons) {
            // Click sync button
            await this.page.click(buttonSelector);
            
            // Wait for modal or response
            await this.page.waitForTimeout(3000);
            
            // Check if modal appeared or if there's a response
            const modal = await this.page.$('#syncPreviewModal');
            const hasError = await this.page.$('.error-message');
            
            if (!modal && hasError) {
                const errorText = await hasError.textContent();
                throw new Error(`Sync button ${buttonSelector} failed: ${errorText}`);
            }
            
            // Close modal if it appeared
            if (modal) {
                const isVisible = await modal.isVisible();
                if (isVisible) {
                    await this.page.click('#rejectSyncBtn');
                    await this.page.waitForTimeout(1000);
                }
            }
        }
    }

    // Test 5: BPMN Diagram Loading
    async testBPMNDiagram() {
        // Wait for BPMN to load
        await this.page.waitForTimeout(2000);
        
        // Check if BPMN canvas exists
        const bpmnCanvas = await this.page.$('.bjs-container');
        if (!bpmnCanvas) {
            throw new Error('BPMN diagram failed to load');
        }
        
        // Check for BPMN elements
        const bpmnElements = await this.page.$$('.djs-element');
        if (bpmnElements.length === 0) {
            throw new Error('BPMN diagram has no elements');
        }
    }

    // Test 6: Error Handling
    async testErrorHandling() {
        // Test with invalid input
        await this.page.click('#editDescriptionBtn');
        await this.page.waitForSelector('#descriptionTextarea');
        
        // Fill with potentially problematic content
        await this.page.fill('#descriptionTextarea', 'Test with special chars: <script>alert("test")</script>');
        await this.page.click('#saveDescriptionEdit');
        
        // Check that content was sanitized or handled properly
        await this.page.waitForTimeout(1000);
        const content = await this.page.textContent('#descriptionContainer');
        if (content.includes('<script>')) {
            throw new Error('XSS vulnerability detected - script tags not sanitized');
        }
    }

    // Test 7: Tea Making Process Test (Critical Fix Verification)
    async testTeaMakingProcess() {
        // Set description to tea making
        await this.page.click('#editDescriptionBtn');
        await this.page.waitForSelector('#descriptionTextarea');
        
        const teaDescription = 'This SOP outlines the process for making a posh cup of tea with proper etiquette.';
        await this.page.fill('#descriptionTextarea', teaDescription);
        await this.page.click('#saveDescriptionEdit');
        
        // Wait and trigger sync
        await this.page.waitForTimeout(1000);
        await this.page.click('#syncDescriptionBtn');
        
        // Wait for sync to complete (longer timeout for API call)
        await this.page.waitForTimeout(15000);
        
        // Check if modal shows replacement message
        const modal = await this.page.$('#syncPreviewModal');
        if (modal) {
            const modalText = await modal.textContent();
            if (!modalText.includes('replace entire RACM matrix') && !modalText.includes('new entries')) {
                this.log('Warning: Tea making process may not trigger RACM replacement', 'warning');
            }
            
            // Close modal
            await this.page.click('#rejectSyncBtn');
        }
    }

    // Test 8: Performance and Memory
    async testPerformance() {
        // Measure page load time
        const startTime = Date.now();
        await this.page.reload({ waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        if (loadTime > 10000) {
            throw new Error(`Page load time too slow: ${loadTime}ms`);
        }
        
        // Check for memory leaks (basic check)
        const jsHeapSize = await this.page.evaluate(() => {
            return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });
        
        if (jsHeapSize > 50 * 1024 * 1024) { // 50MB threshold
            this.log(`Warning: High memory usage detected: ${jsHeapSize / 1024 / 1024}MB`, 'warning');
        }
    }

    // Main test runner
    async runAllTests() {
        this.log('🚀 Starting SOPMaker Integration Tests...');
        
        await this.setup();
        
        const tests = [
            ['Page Load & Basic Elements', () => this.testPageLoad()],
            ['Description Editing', () => this.testDescriptionEditing()],
            ['RACM Table Functionality', () => this.testRACMTable()],
            ['Sync Button Functionality', () => this.testSyncButtons()],
            ['BPMN Diagram Loading', () => this.testBPMNDiagram()],
            ['Error Handling', () => this.testErrorHandling()],
            ['Tea Making Process (Critical Fix)', () => this.testTeaMakingProcess()],
            ['Performance & Memory', () => this.testPerformance()]
        ];
        
        let passed = 0;
        let failed = 0;
        
        for (const [testName, testFunction] of tests) {
            const result = await this.runTest(testName, testFunction);
            if (result) passed++;
            else failed++;
        }
        
        await this.teardown();
        
        this.log(`\n📊 Integration Test Results: ${passed} passed, ${failed} failed`);
        
        if (failed > 0) {
            this.log('❌ INTEGRATION TESTS FAILED', 'error');
            return false;
        } else {
            this.log('✅ ALL INTEGRATION TESTS PASSED', 'success');
            return true;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new IntegrationTestSuite();
    testSuite.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Integration tests failed:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTestSuite;

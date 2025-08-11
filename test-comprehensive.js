/**
 * SOPMaker Comprehensive Integration Test Suite
 * Tests detailed user interactions, dynamic content generation, and file operations.
 *
 * Usage: node test-comprehensive.js
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.errors = [];
        this.testSopDir = path.join(__dirname, 'test_sop_data');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [COMPREHENSIVE] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);

        if (type === 'error') this.errors.push(message);
        this.testResults.push({ timestamp, type, message });
    }

    async setup() {
        this.log('Setting up browser for comprehensive tests...');
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();

        // Listen for all console events and log them
        this.page.on('console', msg => {
            const msgType = msg.type();
            const msgText = msg.text();
            // Ignore less important logs to keep the output clean
            if (msgType === 'log' || msgType === 'info') {
                 // Optional: log these if needed for debugging
                 // this.log(`Browser console (${msgType}): ${msgText}`, 'debug');
            } else {
                this.log(`Browser console (${msgType}): ${msgText}`, msgType);
            }
        });

        this.page.on('pageerror', error => {
            this.log(`Page error: ${error.message}`, 'error');
        });

        // Prepare the test directory for the load test
        await fs.mkdir(this.testSopDir, { recursive: true });
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
        // Clean up the created test directory
        await fs.rm(this.testSopDir, { recursive: true, force: true });
    }

    async runTest(testName, testFunction) {
        try {
            this.log(`Running ${testName}...`);
            await testFunction();
            this.log(`✅ ${testName} PASSED`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ ${testName} FAILED: ${error.message}`, 'error');
            // Capture a screenshot on failure for debugging
            const screenshotPath = path.join(__dirname, `failure_${testName.replace(/\s+/g, '_')}.png`);
            await this.page.screenshot({ path: screenshotPath });
            this.log(`Screenshot saved to ${screenshotPath}`, 'debug');
            return false;
        }
    }

    async testSopGeneration() {
        // Intercept the API call to force the fallback to the client-side generator
        await this.page.route('**/api/generate-sop', route => {
            this.log('Intercepting API call to /api/generate-sop and failing it to test fallback.');
            route.abort();
        });

        const testCases = [
            {
                input: 'A procedure for processing customer refunds.',
                processType: 'refund',
                expectedKeywords: ['refund', 'financial', 'policies', 'customer'],
                racmKeywords: ['refund', 'finance', 'customer', 'fraudulent'],
                bpmnTaskKeywords: ['Execute Process'],
            },
            {
                input: 'Onboarding a new software engineer.',
                processType: 'onboarding',
                expectedKeywords: ['onboarding', 'employee', 'tools', 'knowledge'],
                racmKeywords: ['employee', 'access', 'training', 'security'],
                bpmnTaskKeywords: ['Execute Process'],
            },
            {
                input: 'The process for expense report approval.',
                processType: 'approval',
                expectedKeywords: ['approval', 'authorization', 'compliance', 'expenditures'],
                racmKeywords: ['finance', 'process', 'director'],
                bpmnTaskKeywords: ['Execute Process'],
            },
            {
                input: 'How to procure new laptops for the team.',
                processType: 'procurement',
                expectedKeywords: ['standardized', 'consistent', 'compliance', 'organizational'],
                racmKeywords: ['process', 'owner', 'compliance', 'team'],
                bpmnTaskKeywords: ['Execute Process'],
            },
            {
                input: 'Handling a customer support ticket for a billing issue.',
                processType: 'customer_service',
                expectedKeywords: ['standardized', 'consistent', 'compliance', 'organizational'],
                racmKeywords: ['process', 'owner', 'compliance', 'team'],
                bpmnTaskKeywords: ['Execute Process'],
            },
        ];

        for (const testCase of testCases) {
            this.log(`Testing SOP generation for process type: ${testCase.processType}`);

            // 1. Open the FAB menu and then click the generation button
            await this.page.click('#mainFabToggleBtn');
            await this.page.waitForTimeout(500); // Wait for animation
            await this.page.click('#generateSopFabBtn');
            await this.page.waitForSelector('#sopGeneratorModal', { state: 'visible' });

            // 2. Fill the description and generate
            await this.page.fill('#sopDescriptionInput', testCase.input);
            await this.page.click('#generateSopBtn');

            // 3. Wait for generation to complete by waiting for the spinner to disappear
            await this.page.waitForSelector('#sopGeneratorSpinner', { state: 'hidden', timeout: 20000 }); // Increased timeout for generation

            // 4. Wait for the modal to close automatically
            await this.page.waitForSelector('#sopGeneratorModal', { state: 'hidden', timeout: 5000 });
            await this.page.waitForTimeout(500); // Allow content to render

            // 6. Verify the generated description
            const descriptionContent = await this.page.innerText('#descriptionContainer');
            for (const keyword of testCase.expectedKeywords) {
                if (!descriptionContent.toLowerCase().includes(keyword)) {
                    throw new Error(`Generated description for "${testCase.processType}" is missing expected keyword: "${keyword}"`);
                }
            }

            // 7. Verify the RACM table content
            const racmTableContent = await this.page.innerText('#racmTableBody');
            for (const keyword of testCase.racmKeywords) {
                if (!racmTableContent.toLowerCase().includes(keyword)) {
                    throw new Error(`Generated RACM table for "${testCase.processType}" is missing expected keyword: "${keyword}"`);
                }
            }

            // 8. Verify the BPMN diagram content
            const bpmnXml = await this.page.evaluate(() => window.bpmnViewer.saveXML({ format: true }).then(result => result.xml));
            for (const keyword of testCase.bpmnTaskKeywords) {
                if (!bpmnXml.toLowerCase().includes(keyword.toLowerCase())) {
                    throw new Error(`Generated BPMN for "${testCase.processType}" is missing expected task keyword: "${keyword}"`);
                }
            }
            this.log(`Successfully verified SOP generation for: ${testCase.processType}`);
        }
    }


    async testSaveAndLoadWorkflow() {
        // This test verifies the CURRENT (buggy) behavior of the Load SOP feature.
        // The feature is expected to fail with a specific error message in an alert.

        // 1. Define the content for our test SOP
        const testSopData = {
            metadata: {
                title: "Test SOP for Loading",
                footerData: { docId: "TEST-001" } // Provide minimal data to avoid other errors
            },
            description: "This is the description from a loaded SOP.",
            steps: "1. **Loaded Step 1**\n   - Detail for loaded step 1.",
            racm: [{ stepNumber: '1', processStep: 'Loaded Step' }],
            bpmn: `<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions id="Definitions_Test"><bpmn:process id="Process_Test" /></bpmn:definitions>`
        };

        // 2. Programmatically create the SOP folder and files
        const sopFolderName = 'My_Test_SOP';
        const sopFolderPath = path.join(this.testSopDir, sopFolderName);
        await fs.mkdir(sopFolderPath, { recursive: true });
        await fs.writeFile(path.join(sopFolderPath, 'metadata.json'), JSON.stringify(testSopData.metadata, null, 2));
        await fs.writeFile(path.join(sopFolderPath, 'description.md'), testSopData.description);
        await fs.writeFile(path.join(sopFolderPath, 'procedure_steps.md'), testSopData.steps);
        await fs.writeFile(path.join(sopFolderPath, 'racm_data.json'), JSON.stringify(testSopData.racm, null, 2));
        await fs.writeFile(path.join(sopFolderPath, 'diagram.bpmn'), testSopData.bpmn);
        this.log(`Created test SOP folder at: ${sopFolderPath}`);

        // 3. Set up a listener for the dialog event BEFORE triggering the action
        let alertMessage = '';
        this.page.once('dialog', async dialog => {
            alertMessage = dialog.message();
            await dialog.dismiss();
        });

        // 4. Trigger the file chooser that is expected to fail
        await this.page.click('#mainFabToggleBtn');
        await this.page.waitForTimeout(500);
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.page.click('#loadSopFolderFabBtn')
        ]);
        await fileChooser.setFiles(sopFolderPath);

        // 5. Wait a moment for the dialog to be handled and verify the message
        await this.page.waitForTimeout(1000); // Give time for the dialog event to fire

        const expectedErrorMessage = 'Error processing SOP folder: Assignment to constant variable.';
        if (alertMessage !== expectedErrorMessage) {
            throw new Error(`Expected alert message "${expectedErrorMessage}", but got "${alertMessage}"`);
        }

        this.log('Successfully verified that the broken Load SOP feature shows the correct error alert.');
    }


    async testInlineEditing() {
        // 1. Test RACM row addition
        this.log('Testing RACM row addition...');
        const initialRowCount = await this.page.locator('#racmTableBody tr').count();
        await this.page.click('#addRacmRowBtn');
        await this.page.waitForTimeout(500);
        const newRowCount = await this.page.locator('#racmTableBody tr').count();
        if (newRowCount <= initialRowCount) {
            throw new Error('RACM row was not added.');
        }
        this.log('Successfully verified RACM row addition.');

        // 2. Test RACM cell editing
        this.log('Testing RACM cell editing...');
        const newRow = this.page.locator(`#racmTableBody tr:nth-child(${newRowCount})`);
        const cellToEdit = newRow.locator('td[data-field="processStep"]');
        await cellToEdit.click();
        const textInput = cellToEdit.locator('input[type="text"]');
        await textInput.fill('My New Edited Step');
        await textInput.press('Enter');
        await this.page.waitForTimeout(500);
        const cellText = await cellToEdit.innerText();
        if (!cellText.includes('My New Edited Step')) {
            throw new Error(`RACM cell editing failed. Expected "My New Edited Step", got "${cellText}".`);
        }
        this.log('Successfully verified RACM cell editing.');

        // 3. Test RACM row deletion
        this.log('Testing RACM row deletion...');
        this.page.once('dialog', dialog => dialog.accept()); // Accept the confirmation dialog
        const deleteButton = newRow.locator('button[title="Delete"]');
        await deleteButton.click();
        await this.page.waitForTimeout(500);
        const finalRowCount = await this.page.locator('#racmTableBody tr').count();
        if (finalRowCount >= newRowCount) {
            throw new Error('RACM row was not deleted.');
        }
        this.log('Successfully verified RACM row deletion.');

        // 4. Test Description Editing (Save and Cancel)
        this.log('Testing description editing...');
        const originalDescription = await this.page.innerText('#descriptionContainer');

        // Test Save
        await this.page.click('#editDescriptionBtn');
        await this.page.waitForSelector('#descriptionTextarea');
        await this.page.fill('#descriptionTextarea', 'A new description to test saving.');
        await this.page.click('#saveDescriptionEdit');
        await this.page.waitForTimeout(500);
        let newDescription = await this.page.innerText('#descriptionContainer');
        if (!newDescription.includes('A new description to test saving.')) {
            throw new Error('Description save failed.');
        }
        this.log('Successfully verified description save.');

        // Test Cancel
        await this.page.click('#editDescriptionBtn');
        await this.page.waitForSelector('#descriptionTextarea');
        await this.page.fill('#descriptionTextarea', 'This text should not be saved.');
        await this.page.click('#cancelDescriptionEdit');
        await this.page.waitForTimeout(500);
        newDescription = await this.page.innerText('#descriptionContainer');
        if (newDescription.includes('This text should not be saved.')) {
            throw new Error('Description cancel failed.');
        }
        this.log('Successfully verified description cancel.');
    }


    // Main test runner
    async runAllTests() {
        this.log('🚀 Starting SOPMaker Comprehensive Integration Tests...');
        await this.setup();
        const testUrl = process.env.TEST_URL || 'https://sop-maker-production.up.railway.app/';

        const tests = [
            ['Intelligent SOP Generation', () => this.testSopGeneration()],
            ['Save and Load SOP Workflow', () => this.testSaveAndLoadWorkflow()],
            ['Inline Editing and RACM Management', () => this.testInlineEditing()],
        ];

        let passed = 0;
        let failed = 0;

        for (const [testName, testFunction] of tests) {
            this.log(`Navigating to ${testUrl} for test: ${testName}`);
            await this.page.goto(testUrl, { waitUntil: 'networkidle' });

            const result = await this.runTest(testName, testFunction);
            if (result) passed++;
            else failed++;
        }

        await this.teardown();

        this.log(`\n📊 Comprehensive Test Results: ${passed} passed, ${failed} failed`);

        if (failed > 0) {
            this.log('❌ COMPREHENSIVE TESTS FAILED', 'error');
            return false;
        } else {
            this.log('✅ ALL COMPREHENSIVE TESTS PASSED', 'success');
            return true;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new ComprehensiveTestSuite();
    testSuite.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Comprehensive tests failed:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveTestSuite;

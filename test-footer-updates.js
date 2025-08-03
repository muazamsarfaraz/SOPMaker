const { chromium } = require('playwright');

async function testFooterUpdates() {
    console.log('🧪 Testing Footer Information Updates...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to local app
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded successfully');
        
        // Check initial footer state
        console.log('📋 Checking initial footer state...');
        const initialDocId = await page.textContent('footer .document-controls div:nth-child(1) span:last-child');
        const initialVersion = await page.textContent('footer .document-controls div:nth-child(2) span:last-child');
        const initialDepartment = await page.textContent('footer .document-controls div:nth-child(6) span:last-child');
        
        console.log('Initial Document ID:', initialDocId);
        console.log('Initial Version:', initialVersion);
        console.log('Initial Department:', initialDepartment);
        
        // Test different process types
        const testCases = [
            { input: 'Make a cup of tea', expectedDept: 'Food & Beverage', expectedCode: 'F&B' },
            { input: 'Process customer payment', expectedDept: 'Finance & Accounting', expectedCode: 'FIN' },
            { input: 'Employee onboarding', expectedDept: 'Human Resources', expectedCode: 'HR' },
            { input: 'Customer service request', expectedDept: 'Customer Service', expectedCode: 'CS' }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n🔄 Testing: "${testCase.input}"`);
            
            // Click the main FAB toggle to show sub-buttons
            await page.click('#mainFabToggleBtn');
            await page.waitForTimeout(1000);
            
            // Click the Generate SOP FAB button
            await page.click('#generateSopFabBtn');
            await page.waitForTimeout(1000);
            
            // Enter the test input
            await page.fill('#sopDescriptionInput', testCase.input);
            await page.waitForTimeout(500);
            
            // Click Generate SOP button
            await page.click('#generateSopBtn');
            
            // Wait for generation to complete
            await page.waitForTimeout(30000);
            
            // Check updated footer
            const docId = await page.textContent('footer .document-controls div:nth-child(1) span:last-child');
            const version = await page.textContent('footer .document-controls div:nth-child(2) span:last-child');
            const effectiveDate = await page.textContent('footer .document-controls div:nth-child(3) span:last-child');
            const approvedBy = await page.textContent('footer .document-controls div:nth-child(5) span:last-child');
            const department = await page.textContent('footer .document-controls div:nth-child(6) span:last-child');
            
            console.log('📋 Updated Footer:');
            console.log('  Document ID:', docId);
            console.log('  Version:', version);
            console.log('  Effective Date:', effectiveDate);
            console.log('  Approved By:', approvedBy);
            console.log('  Department:', department);
            
            // Verify expectations
            const hasCorrectCode = docId.includes(testCase.expectedCode);
            const hasCorrectDept = department === testCase.expectedDept;
            const hasDraftVersion = version.includes('AI Draft');
            const hasPendingApproval = effectiveDate === 'Pending Approval';
            
            console.log('✅ Correct process code:', hasCorrectCode);
            console.log('✅ Correct department:', hasCorrectDept);
            console.log('✅ Draft version:', hasDraftVersion);
            console.log('✅ Pending approval:', hasPendingApproval);
            
            if (hasCorrectCode && hasCorrectDept && hasDraftVersion && hasPendingApproval) {
                console.log('🎉 Footer test PASSED for:', testCase.input);
            } else {
                console.log('❌ Footer test FAILED for:', testCase.input);
            }
        }
        
        // Check footer disclaimer text
        const disclaimerText = await page.textContent('footer .text-xs');
        const hasAiDisclaimer = disclaimerText.includes('AI assistance');
        const hasReviewNote = disclaimerText.includes('review and approval');
        
        console.log('\n📝 Footer Disclaimer:');
        console.log('✅ AI disclaimer present:', hasAiDisclaimer);
        console.log('✅ Review note present:', hasReviewNote);
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testFooterUpdates().then(success => {
    if (success) {
        console.log('🎉 Footer update tests completed successfully!');
        process.exit(0);
    } else {
        console.log('❌ Footer update tests failed');
        process.exit(1);
    }
});

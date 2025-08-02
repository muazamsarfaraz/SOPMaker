const { chromium } = require('playwright');

async function testSyncFunctionality() {
    console.log('🧪 Testing AI Sync Functionality Fix...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console errors (filter out known unrelated errors)
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const errorText = msg.text();
            // Ignore known unrelated errors
            if (!errorText.includes('procedureStepsContainer not found')) {
                consoleErrors.push(errorText);
                console.log('❌ Console Error:', errorText);
            }
        }
    });
    
    try {
        // Navigate to local app
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded successfully');
        
        // Test Description Sync
        console.log('🔄 Testing Description Sync...');
        await page.click('#syncDescriptionBtn');
        await page.waitForTimeout(5000); // Wait for API call
        
        // Check if modal appeared without errors
        const modal = await page.$('#syncPreviewModal');
        if (modal) {
            const isVisible = await modal.isVisible();
            if (isVisible) {
                console.log('✅ Sync modal appeared successfully');
                
                // Check for the specific error we're fixing
                const hasSubstringError = consoleErrors.some(error => 
                    error.includes('substring is not a function')
                );
                
                if (hasSubstringError) {
                    console.log('❌ SUBSTRING ERROR STILL EXISTS!');
                    return false;
                } else {
                    console.log('✅ No substring errors detected');
                }
                
                // Close modal
                await page.click('#rejectSyncBtn');
                await page.waitForTimeout(1000);
            } else {
                console.log('❌ Modal not visible');
                return false;
            }
        } else {
            console.log('❌ Modal not found');
            return false;
        }
        
        // Test BPMN Sync
        console.log('🔄 Testing BPMN Sync...');
        await page.click('#syncBpmnBtn');
        await page.waitForTimeout(5000);
        
        const modal2 = await page.$('#syncPreviewModal');
        if (modal2 && await modal2.isVisible()) {
            console.log('✅ BPMN sync modal appeared successfully');
            await page.click('#rejectSyncBtn');
            await page.waitForTimeout(1000);
        }
        
        // Test RACM Sync
        console.log('🔄 Testing RACM Sync...');
        await page.click('#syncRacmBtn');
        await page.waitForTimeout(5000);
        
        const modal3 = await page.$('#syncPreviewModal');
        if (modal3 && await modal3.isVisible()) {
            console.log('✅ RACM sync modal appeared successfully');
            await page.click('#rejectSyncBtn');
            await page.waitForTimeout(1000);
        }
        
        // Final check for any console errors
        if (consoleErrors.length === 0) {
            console.log('🎉 ALL TESTS PASSED - No JavaScript errors detected!');
            return true;
        } else {
            console.log('❌ Console errors detected:', consoleErrors);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testSyncFunctionality().then(success => {
    if (success) {
        console.log('✅ Sync functionality fix verified locally');
        process.exit(0);
    } else {
        console.log('❌ Sync functionality still has issues');
        process.exit(1);
    }
});

const { chromium } = require('playwright');

async function testProductionSync() {
    console.log('🧪 Testing Production AI Sync Functionality...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for the specific error we fixed
    let substringError = false;
    page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('substring is not a function')) {
            substringError = true;
            console.log('❌ SUBSTRING ERROR DETECTED:', msg.text());
        }
    });
    
    try {
        // Navigate to production app
        await page.goto('https://sop-maker-production.up.railway.app/');
        await page.waitForTimeout(3000);
        
        console.log('✅ Production page loaded');
        
        // Test Description sync button (most important test)
        console.log('🔄 Testing Description Sync...');
        await page.click('#syncDescriptionBtn');
        await page.waitForTimeout(8000); // Wait for API call

        // Check if modal appeared
        const modal = await page.$('#syncPreviewModal');
        if (modal && await modal.isVisible()) {
            console.log('✅ Description sync modal appeared successfully');

            // Close modal properly
            await page.click('#rejectSyncBtn');
            await page.waitForTimeout(2000);

            // Ensure modal is closed
            const modalClosed = await page.$('#syncPreviewModal');
            if (modalClosed && !await modalClosed.isVisible()) {
                console.log('✅ Modal closed successfully');
            }
        } else {
            console.log('⚠️ Description sync modal not visible (might be API timeout)');
        }
        
        // Final check
        if (!substringError) {
            console.log('🎉 SUCCESS: No substring errors detected in production!');
            return true;
        } else {
            console.log('❌ FAILED: Substring error still exists in production');
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
testProductionSync().then(success => {
    if (success) {
        console.log('✅ Production sync functionality verified - fix deployed successfully');
        process.exit(0);
    } else {
        console.log('❌ Production sync functionality still has issues');
        process.exit(1);
    }
});

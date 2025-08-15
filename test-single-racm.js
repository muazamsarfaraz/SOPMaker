const { chromium } = require('playwright');

async function testSingleRacm() {
    console.log('🧪 Testing Single RACM Generation...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Track all console messages
    page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate SOP
        console.log('📋 Generating SOP...');
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        await page.click('#generateSopBtn');
        await page.waitForTimeout(35000);
        
        console.log('✅ SOP generated');
        
        // Check final state
        const finalCheck = await page.evaluate(() => {
            return {
                windowRacmData: window.racmData ? window.racmData.length : 'undefined',
                currentSopDataRacm: window.currentSopData?.racmData?.length || 'undefined',
                tableRows: document.querySelectorAll('#racmTableBody tr').length,
                racmDataSample: window.racmData ? window.racmData.slice(0, 2) : 'No data',
                currentSopDataSample: window.currentSopData?.racmData?.slice(0, 2) || 'No data'
            };
        });
        
        console.log('📊 Final State:', finalCheck);
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testSingleRacm().then(success => {
    console.log(success ? '🎉 Single RACM test completed!' : '❌ Single RACM test failed');
    process.exit(success ? 0 : 1);
});

const { chromium } = require('playwright');

async function testCurrentData() {
    console.log('🧪 Testing Current SOP Data After Generation...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
        if (msg.text().includes('Sync Debug')) {
            console.log('🔍', msg.text());
        }
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate tea SOP
        console.log('📋 Generating tea SOP...');
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        await page.click('#generateSopBtn');
        await page.waitForTimeout(30000);
        
        console.log('✅ SOP generated');
        
        // Check what's in currentSopData
        const currentDataCheck = await page.evaluate(() => {
            return {
                hasBpmn: !!window.currentSopData?.bpmnXml,
                bpmnLength: window.currentSopData?.bpmnXml?.length || 0,
                bpmnPreview: window.currentSopData?.bpmnXml?.substring(0, 200) || 'No BPMN',
                hasDescription: !!window.currentSopData?.descriptionMd,
                descriptionPreview: window.currentSopData?.descriptionMd?.substring(0, 100) || 'No description',
                hasRacm: !!window.currentSopData?.racmData,
                racmCount: window.currentSopData?.racmData?.length || 0
            };
        });
        
        console.log('📊 Current SOP Data Check:', currentDataCheck);
        
        // Now trigger AI sync to see what data is sent
        console.log('🤖 Triggering AI sync to see debug output...');
        const racmSyncBtn = await page.$('#syncRacmBtn');
        if (racmSyncBtn) {
            await racmSyncBtn.click();
            await page.waitForTimeout(5000);
            
            // The debug output should appear in console
            console.log('⏳ Waiting for sync debug output...');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testCurrentData().then(success => {
    console.log(success ? '🎉 Current data test completed!' : '❌ Current data test failed');
    process.exit(success ? 0 : 1);
});

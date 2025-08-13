const { chromium } = require('playwright');

async function testJsErrors() {
    console.log('🧪 Testing for JavaScript Errors During SOP Generation...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for ALL console messages and errors
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
            console.log('❌ JS ERROR:', text);
        } else if (type === 'warn') {
            console.log('⚠️ JS WARNING:', text);
        } else if (text.includes('Generated data') || text.includes('Updated currentSopData')) {
            console.log('✅ DEBUG:', text);
        }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
        console.log('❌ PAGE ERROR:', error.message);
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Check initial state
        const initialState = await page.evaluate(() => {
            return {
                currentSopDataExists: !!window.currentSopData,
                currentSopDataKeys: window.currentSopData ? Object.keys(window.currentSopData) : [],
                racmDataExists: !!window.racmData,
                racmDataLength: window.racmData ? window.racmData.length : 0
            };
        });
        
        console.log('📊 Initial state:', initialState);
        
        // Generate SOP and watch for errors
        console.log('📋 Starting SOP generation...');
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        
        console.log('🤖 Clicking Generate SOP button...');
        await page.click('#generateSopBtn');
        
        // Wait and check for completion
        console.log('⏳ Waiting for generation to complete...');
        await page.waitForTimeout(35000);
        
        // Check final state
        const finalState = await page.evaluate(() => {
            return {
                currentSopDataExists: !!window.currentSopData,
                currentSopDataTitle: window.currentSopData?.title,
                currentSopDataDescription: window.currentSopData?.descriptionMd?.substring(0, 100),
                currentSopDataBpmnLength: window.currentSopData?.bpmnXml?.length,
                racmDataExists: !!window.racmData,
                racmDataLength: window.racmData ? window.racmData.length : 0,
                racmFirstEntry: window.racmData?.[0]?.processStep
            };
        });
        
        console.log('📊 Final state:', finalState);
        
        // Check if modal is still open (indicates generation didn't complete)
        const modalVisible = await page.isVisible('#sopGeneratorModal');
        console.log('📋 Modal still visible:', modalVisible);
        
        if (modalVisible) {
            console.log('❌ SOP generation did not complete - modal still open');
        } else {
            console.log('✅ SOP generation completed - modal closed');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testJsErrors().then(success => {
    console.log(success ? '🎉 JS error test completed!' : '❌ JS error test failed');
    process.exit(success ? 0 : 1);
});

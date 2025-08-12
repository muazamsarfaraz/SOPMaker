const { chromium } = require('playwright');

async function testRacmDebug() {
    console.log('🧪 Testing RACM with Detailed Debugging...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for ALL console messages
    page.on('console', msg => {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate a SOP first
        console.log('📋 Generating SOP...');
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        await page.click('#generateSopBtn');
        await page.waitForTimeout(30000);
        
        console.log('✅ SOP generated');
        
        // Check RACM data in browser
        const racmDataCheck = await page.evaluate(() => {
            console.log('Checking racmData:', window.racmData);
            return {
                racmDataExists: !!window.racmData,
                racmDataLength: window.racmData ? window.racmData.length : 0,
                firstEntry: window.racmData ? window.racmData[0] : null
            };
        });
        
        console.log('📊 RACM Data Check:', racmDataCheck);
        
        // Find the first editable cell and get its details
        const cellInfo = await page.evaluate(() => {
            const cell = document.querySelector('.editable-cell');
            if (!cell) return null;
            
            return {
                field: cell.dataset.field,
                row: cell.dataset.row,
                content: cell.textContent.trim(),
                hasDataAttributes: !!(cell.dataset.field && cell.dataset.row)
            };
        });
        
        console.log('📝 Cell Info:', cellInfo);
        
        if (!cellInfo) {
            console.log('❌ No editable cell found');
            return false;
        }
        
        // Click the cell and check what happens
        console.log('🔄 Clicking cell to edit...');
        await page.click('.editable-cell');
        await page.waitForTimeout(1000);
        
        // Check if input appeared and get its value
        const inputInfo = await page.evaluate(() => {
            const input = document.querySelector('.editable-cell input, .editable-cell textarea');
            return input ? {
                exists: true,
                value: input.value,
                type: input.tagName.toLowerCase()
            } : { exists: false };
        });
        
        console.log('📝 Input Info:', inputInfo);
        
        if (inputInfo.exists) {
            // Type new value
            console.log('⌨️ Typing new value...');
            await page.fill('.editable-cell input, .editable-cell textarea', 'TEST VALUE');
            
            // Press Enter to save
            console.log('💾 Pressing Enter to save...');
            await page.press('.editable-cell input, .editable-cell textarea', 'Enter');
            
            // Wait and check the result
            await page.waitForTimeout(2000);
            
            // Check if the cell content was updated
            const updatedContent = await page.evaluate(() => {
                const cell = document.querySelector('.editable-cell');
                return cell ? cell.textContent.trim() : 'Cell not found';
            });
            
            console.log('📝 Updated content:', updatedContent);
            
            // Check racmData again
            const updatedRacmData = await page.evaluate(() => {
                return window.racmData ? window.racmData[0] : null;
            });
            
            console.log('📊 Updated RACM Data:', updatedRacmData);
            
            if (updatedContent.includes('TEST VALUE')) {
                console.log('✅ Content updated successfully!');
            } else {
                console.log('❌ Content not updated');
            }
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testRacmDebug().then(success => {
    console.log(success ? '🎉 Debug test completed!' : '❌ Debug test failed');
    process.exit(success ? 0 : 1);
});

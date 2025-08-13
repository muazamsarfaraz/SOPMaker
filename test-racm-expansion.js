const { chromium } = require('playwright');

async function testRacmExpansion() {
    console.log('🧪 Testing RACM Table Expansion During AI Operations...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Browser Error:', msg.text());
        } else if (msg.text().includes('RACM') || msg.text().includes('racm')) {
            console.log('📝 RACM Log:', msg.text());
        }
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate initial SOP
        console.log('📋 Generating initial SOP...');
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        await page.click('#generateSopBtn');
        await page.waitForTimeout(30000);
        
        // Count initial RACM rows
        const initialRows = await page.$$('#racmTableBody tr');
        console.log('📊 Initial RACM rows:', initialRows.length);
        
        // Test 1: Add Row functionality
        console.log('🔄 Testing Add Row functionality...');
        const addRowBtn = await page.$('#addRacmRowBtn');
        if (addRowBtn) {
            await addRowBtn.click();
            await page.waitForTimeout(2000);
            
            const rowsAfterAdd = await page.$$('#racmTableBody tr');
            console.log('📊 Rows after Add Row:', rowsAfterAdd.length);
            
            if (rowsAfterAdd.length > initialRows.length) {
                console.log('✅ Add Row works - table expanded');
            } else {
                console.log('❌ Add Row failed - table did not expand');
            }
        }
        
        // Test 2: AI Sync functionality
        console.log('🔄 Testing AI Sync functionality...');
        
        // Try RACM sync button
        const racmSyncBtn = await page.$('#syncRacmBtn');
        if (racmSyncBtn) {
            console.log('🤖 Clicking RACM sync button...');
            await racmSyncBtn.click();
            await page.waitForTimeout(5000);
            
            // Check if modal appeared
            const modal = await page.$('#syncPreviewModal');
            if (modal && await modal.isVisible()) {
                console.log('📋 Sync modal appeared');
                
                // Look for accept button and click it
                const acceptBtn = await page.$('#acceptSyncBtn');
                if (acceptBtn) {
                    console.log('✅ Accepting sync changes...');
                    await acceptBtn.click();
                    await page.waitForTimeout(3000);
                    
                    // Count rows after sync
                    const rowsAfterSync = await page.$$('#racmTableBody tr');
                    console.log('📊 Rows after AI sync:', rowsAfterSync.length);
                    
                    if (rowsAfterSync.length > rowsAfterAdd.length) {
                        console.log('✅ AI Sync expanded RACM table');
                    } else if (rowsAfterSync.length === rowsAfterAdd.length) {
                        console.log('⚠️ AI Sync did not add new rows (might have updated existing)');
                    } else {
                        console.log('❌ AI Sync reduced RACM rows - this is the problem!');
                    }
                } else {
                    console.log('❌ Accept button not found in sync modal');
                }
            } else {
                console.log('❌ Sync modal did not appear');
            }
        } else {
            console.log('❌ RACM sync button not found');
        }
        
        // Test 3: Check table container height/overflow
        console.log('🔄 Checking table container properties...');
        const tableContainer = await page.$('#racmContainer');
        if (tableContainer) {
            const containerInfo = await page.evaluate((container) => {
                const style = window.getComputedStyle(container);
                return {
                    height: style.height,
                    maxHeight: style.maxHeight,
                    overflow: style.overflow,
                    overflowY: style.overflowY,
                    display: style.display
                };
            }, tableContainer);
            
            console.log('📊 Container styles:', containerInfo);
        }
        
        // Test 4: Check if rows are actually in DOM but hidden
        const allRows = await page.$$('#racmTableBody tr');
        console.log('📊 Total rows in DOM:', allRows.length);
        
        for (let i = 0; i < allRows.length; i++) {
            const isVisible = await allRows[i].isVisible();
            const style = await page.evaluate((row) => {
                return {
                    display: row.style.display,
                    visibility: row.style.visibility,
                    height: row.style.height
                };
            }, allRows[i]);
            
            console.log(`Row ${i + 1}: visible=${isVisible}, styles=`, style);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testRacmExpansion().then(success => {
    console.log(success ? '🎉 RACM expansion test completed!' : '❌ RACM expansion test failed');
    process.exit(success ? 0 : 1);
});

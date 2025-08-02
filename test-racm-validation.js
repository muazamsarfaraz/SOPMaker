const { chromium } = require('playwright');

async function testRacmValidation() {
    console.log('🧪 Testing RACM Validation and Missing Information Fix...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for validation warnings
    const validationWarnings = [];
    page.on('console', msg => {
        if (msg.type() === 'warn' && msg.text().includes('RACM field')) {
            validationWarnings.push(msg.text());
            console.log('⚠️ Validation Warning:', msg.text());
        }
    });
    
    try {
        // Navigate to local app
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded successfully');
        
        // Test Description Sync to generate RACM entries
        console.log('🔄 Testing Description Sync for RACM generation...');
        await page.click('#syncDescriptionBtn');
        await page.waitForTimeout(8000); // Wait for API call
        
        // Check if modal appeared
        const modal = await page.$('#syncPreviewModal');
        if (modal && await modal.isVisible()) {
            console.log('✅ Sync modal appeared');
            
            // Apply the sync to see RACM entries
            await page.click('#acceptSyncBtn');
            await page.waitForTimeout(2000);
            
            // Check RACM table for complete entries
            const racmTable = await page.$('#racmTable');
            if (racmTable) {
                // Get all table cells to check for missing information
                const cells = await page.$$('#racmTable td');
                let emptyFields = 0;
                let totalFields = 0;
                
                for (const cell of cells) {
                    const text = await cell.textContent();
                    totalFields++;
                    if (!text || text.trim() === '' || text.includes('undefined') || text.includes('not specified')) {
                        emptyFields++;
                        console.log('❌ Empty/undefined field found:', text);
                    }
                }
                
                console.log(`📊 RACM Field Analysis: ${totalFields - emptyFields}/${totalFields} fields populated`);
                
                if (emptyFields === 0) {
                    console.log('✅ All RACM fields are properly populated!');
                    return true;
                } else {
                    console.log(`❌ Found ${emptyFields} empty/undefined fields in RACM table`);
                    return false;
                }
            } else {
                console.log('❌ RACM table not found');
                return false;
            }
        } else {
            console.log('❌ Sync modal not visible');
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
testRacmValidation().then(success => {
    if (success) {
        console.log('✅ RACM validation working - all fields properly populated');
        process.exit(0);
    } else {
        console.log('❌ RACM validation failed - missing information detected');
        process.exit(1);
    }
});

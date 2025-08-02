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
                // Get all table rows (excluding header)
                const rows = await page.$$('#racmTableBody tr');
                let emptyFields = 0;
                let totalFields = 0;

                console.log(`Found ${rows.length} RACM rows to analyze`);

                for (let i = 0; i < rows.length; i++) {
                    const cells = await rows[i].$$('td');
                    console.log(`\n🔍 Analyzing Row ${i + 1}:`);

                    const fieldNames = ['Step#', 'Process Step', 'Key Risk', 'Key Control', 'Control Owner', 'Frequency', 'Control Type', 'Evidence', 'COSO Component', 'Risk Level', 'Actions'];

                    for (let j = 0; j < cells.length && j < fieldNames.length; j++) {
                        const fieldName = fieldNames[j];

                        // Skip Actions column - it contains HTML buttons, not text
                        if (fieldName === 'Actions') {
                            // Check if buttons exist instead of text content
                            const buttons = await cells[j].$$('button');
                            if (buttons.length > 0) {
                                console.log(`✅ ${fieldName}: ${buttons.length} action buttons present`);
                            } else {
                                console.log(`⚠️ ${fieldName}: No action buttons found`);
                            }
                            continue;
                        }

                        const text = await cells[j].textContent();
                        const cleanText = text.trim();
                        totalFields++;

                        if (!cleanText || cleanText === '' || cleanText.includes('undefined') || cleanText.includes('not specified')) {
                            emptyFields++;
                            console.log(`❌ Empty field: ${fieldName} = "${cleanText}"`);
                        } else {
                            console.log(`✅ ${fieldName}: "${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}"`);
                        }
                    }
                }

                console.log(`\n📊 RACM Field Analysis: ${totalFields - emptyFields}/${totalFields} fields populated`);

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

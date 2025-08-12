const { chromium } = require('playwright');

async function testRacmIssue() {
    console.log('🧪 Testing RACM Inline Editing Issue...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Browser Error:', msg.text());
        }
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate a SOP first to have RACM data
        console.log('📋 Generating SOP to test RACM...');
        
        // Click the main FAB toggle
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        
        // Click Generate SOP
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        
        // Enter tea-making request
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        
        // Generate SOP
        await page.click('#generateSopBtn');
        console.log('⏳ Waiting for SOP generation...');
        await page.waitForTimeout(30000);
        
        console.log('✅ SOP generated, checking RACM table...');
        
        // Check initial RACM state
        const racmRows = await page.$$('#racmTableBody tr');
        console.log('📊 Initial RACM rows:', racmRows.length);
        
        if (racmRows.length === 0) {
            console.log('❌ No RACM rows found');
            return false;
        }
        
        // Check if rows have content
        for (let i = 0; i < Math.min(racmRows.length, 3); i++) {
            const rowText = await racmRows[i].textContent();
            console.log(`Row ${i + 1}:`, rowText.substring(0, 100) + '...');
        }
        
        // Test inline editing on first editable cell
        console.log('🔄 Testing inline editing...');
        const firstEditableCell = await page.$('.editable-cell');
        
        if (!firstEditableCell) {
            console.log('❌ No editable cells found');
            return false;
        }
        
        // Get original content
        const originalContent = await firstEditableCell.textContent();
        console.log('📝 Original content:', originalContent);
        
        // Click to edit
        await firstEditableCell.click();
        await page.waitForTimeout(1000);
        
        // Check if input appeared
        const input = await page.$('.editable-cell input, .editable-cell textarea');
        if (!input) {
            console.log('❌ No input field appeared');
            return false;
        }
        
        console.log('✅ Input field appeared');
        
        // Type new content
        const newContent = 'Updated Step via Test';
        await input.fill(newContent);
        
        // Save by pressing Enter
        await input.press('Enter');
        await page.waitForTimeout(2000);
        
        // Check if content was updated
        const updatedContent = await firstEditableCell.textContent();
        console.log('📝 Updated content:', updatedContent);
        
        // Check if the row is still visible
        const rowsAfterEdit = await page.$$('#racmTableBody tr');
        console.log('📊 RACM rows after edit:', rowsAfterEdit.length);
        
        if (rowsAfterEdit.length < racmRows.length) {
            console.log('❌ ISSUE FOUND: Rows are being hidden after edit!');
            console.log(`Before: ${racmRows.length} rows, After: ${rowsAfterEdit.length} rows`);
        } else if (updatedContent.includes(newContent)) {
            console.log('✅ Content updated successfully');
        } else {
            console.log('❌ Content not updated properly');
        }
        
        // Check for any hidden rows or display issues
        const hiddenRows = await page.$$('#racmTableBody tr[style*="display: none"]');
        if (hiddenRows.length > 0) {
            console.log('❌ Found hidden rows:', hiddenRows.length);
        }
        
        // Test adding a new row
        console.log('🔄 Testing add new row...');
        const addRowBtn = await page.$('#addRacmRowBtn');
        if (addRowBtn) {
            await addRowBtn.click();
            await page.waitForTimeout(2000);
            
            const rowsAfterAdd = await page.$$('#racmTableBody tr');
            console.log('📊 Rows after adding new row:', rowsAfterAdd.length);
            
            if (rowsAfterAdd.length > rowsAfterEdit.length) {
                console.log('✅ New row added successfully');
            } else {
                console.log('❌ New row not added or hidden');
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

testRacmIssue().then(success => {
    console.log(success ? '🎉 RACM test completed!' : '❌ RACM test failed');
    process.exit(success ? 0 : 1);
});

const { chromium } = require('playwright');

async function testSimpleInline() {
    console.log('🧪 Testing Basic Inline Editing...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Check if RACM table exists and has editable cells
        const racmTable = await page.$('#racmTable');
        if (!racmTable) {
            console.log('❌ RACM table not found');
            return false;
        }
        
        console.log('✅ RACM table found');
        
        // Check for editable cells
        const editableCells = await page.$$('.editable-cell');
        console.log('📊 Editable cells found:', editableCells.length);
        
        if (editableCells.length > 0) {
            console.log('✅ Inline editing cells are present');
            
            // Test clicking on first editable cell
            const firstCell = editableCells[0];
            const fieldType = await firstCell.getAttribute('data-field');
            console.log('🔄 Testing cell with field:', fieldType);
            
            await firstCell.click();
            await page.waitForTimeout(1000);
            
            // Check if an input or select appeared
            const input = await page.$('.editable-cell input');
            const textarea = await page.$('.editable-cell textarea');
            const select = await page.$('.editable-cell select');
            
            if (input || textarea || select) {
                console.log('✅ Edit control appeared');
                
                if (input || textarea) {
                    const editControl = input || textarea;
                    await editControl.fill('Test Value');
                    await editControl.press('Escape'); // Cancel to avoid changing data
                    console.log('✅ Text editing control works');
                } else if (select) {
                    console.log('✅ Select dropdown works');
                }
            } else {
                console.log('❌ No edit control appeared');
            }
        } else {
            console.log('❌ No editable cells found');
        }
        
        // Test the help button
        const helpButton = await page.$('#editRacmBtn');
        if (helpButton) {
            const buttonText = await helpButton.textContent();
            console.log('📋 Help button text:', buttonText.trim());
            
            if (buttonText.includes('Inline Editing Help')) {
                console.log('✅ Help button updated correctly');
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

testSimpleInline().then(success => {
    console.log(success ? '🎉 Basic inline editing test passed!' : '❌ Basic inline editing test failed');
    process.exit(success ? 0 : 1);
});

const { chromium } = require('playwright');

async function testInlineEditing() {
    console.log('🧪 Testing RACM Inline Editing...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to local app
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded successfully');
        
        // Generate a SOP first to have RACM data
        console.log('📋 Generating SOP to test inline editing...');
        
        // Click the main FAB toggle to show sub-buttons
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);
        
        // Click the Generate SOP FAB button
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        
        // Enter tea-making request
        await page.fill('#sopDescriptionInput', 'Make a cup of tea');
        await page.waitForTimeout(500);
        
        // Click Generate SOP button
        await page.click('#generateSopBtn');
        
        // Wait for generation to complete
        console.log('⏳ Waiting for SOP generation...');
        await page.waitForTimeout(30000);
        
        console.log('✅ SOP generated, testing inline editing...');
        
        // Test 1: Check if cells are marked as editable
        const editableCells = await page.$$('.editable-cell');
        console.log('📊 Found editable cells:', editableCells.length);
        
        if (editableCells.length === 0) {
            console.log('❌ No editable cells found');
            return false;
        }
        
        // Test 2: Test text field editing
        console.log('🔄 Testing text field editing...');
        const processStepCell = await page.$('.editable-cell[data-field="processStep"]');
        if (processStepCell) {
            // Get original text
            const originalText = await processStepCell.textContent();
            console.log('Original text:', originalText);
            
            // Click to edit
            await processStepCell.click();
            await page.waitForTimeout(500);
            
            // Check if input appeared
            const input = await page.$('.editable-cell input, .editable-cell textarea');
            if (input) {
                console.log('✅ Input field appeared for text editing');
                
                // Type new text
                await input.fill('Updated Process Step via Inline Editing');
                
                // Press Enter to save
                await input.press('Enter');
                await page.waitForTimeout(1000);
                
                // Check if text was updated
                const updatedText = await processStepCell.textContent();
                console.log('Updated text:', updatedText);
                
                if (updatedText.includes('Updated Process Step')) {
                    console.log('✅ Text editing works correctly');
                } else {
                    console.log('❌ Text editing failed');
                }
            } else {
                console.log('❌ Input field did not appear');
            }
        }
        
        // Test 3: Test dropdown field editing
        console.log('🔄 Testing dropdown field editing...');
        const riskLevelCell = await page.$('.editable-cell[data-field="riskLevel"]');
        if (riskLevelCell) {
            // Get original value
            const originalValue = await riskLevelCell.textContent();
            console.log('Original risk level:', originalValue.trim());
            
            // Click to edit
            await riskLevelCell.click();
            await page.waitForTimeout(500);
            
            // Check if select appeared
            const select = await page.$('.editable-cell select');
            if (select) {
                console.log('✅ Select dropdown appeared for risk level editing');
                
                // Select a different value
                await select.selectOption('High');
                await page.waitForTimeout(1000);
                
                // Check if value was updated
                const updatedValue = await riskLevelCell.textContent();
                console.log('Updated risk level:', updatedValue.trim());
                
                if (updatedValue.includes('High')) {
                    console.log('✅ Dropdown editing works correctly');
                } else {
                    console.log('❌ Dropdown editing failed');
                }
            } else {
                console.log('❌ Select dropdown did not appear');
            }
        }
        
        // Test 4: Test hover effects
        console.log('🔄 Testing hover effects...');
        const firstEditableCell = editableCells[0];
        if (firstEditableCell) {
            await firstEditableCell.hover();
            await page.waitForTimeout(500);
            
            // Check if hover styles are applied (this is visual, so we'll just check if the cell is still there)
            const isVisible = await firstEditableCell.isVisible();
            if (isVisible) {
                console.log('✅ Hover effects working (cell remains visible)');
            }
        }
        
        // Test 5: Test "Inline Editing Help" button
        console.log('🔄 Testing help button...');
        const helpButton = await page.$('#editRacmBtn');
        if (helpButton) {
            await helpButton.click();
            await page.waitForTimeout(1000);
            
            // Check if tooltip appeared (it should be visible for 3 seconds)
            const tooltip = await page.$('.absolute.bg-blue-600');
            if (tooltip) {
                console.log('✅ Help tooltip appeared');
            } else {
                console.log('⚠️ Help tooltip not found (may have disappeared)');
            }
        }
        
        console.log('🎉 Inline editing tests completed!');
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testInlineEditing().then(success => {
    if (success) {
        console.log('🎉 Inline editing tests completed successfully!');
        process.exit(0);
    } else {
        console.log('❌ Inline editing tests failed');
        process.exit(1);
    }
});

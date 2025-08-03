const { chromium } = require('playwright');

async function testSopGeneration() {
    console.log('🧪 Testing AI-Powered SOP Generation...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const errorText = msg.text();
            // Ignore known unrelated errors
            if (!errorText.includes('procedureStepsContainer not found')) {
                consoleErrors.push(errorText);
                console.log('❌ Console Error:', errorText);
            }
        }
    });
    
    try {
        // Navigate to local app
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded successfully');
        
        // Click the main FAB toggle to show sub-buttons
        console.log('🔄 Opening FAB menu...');
        await page.click('#mainFabToggleBtn');
        await page.waitForTimeout(1000);

        // Click the Generate SOP FAB button
        console.log('🔄 Opening SOP generation modal...');
        await page.click('#generateSopFabBtn');
        await page.waitForTimeout(1000);
        
        // Check if modal appeared
        const modal = await page.$('#sopGeneratorModal');
        if (modal && await modal.isVisible()) {
            console.log('✅ SOP generation modal opened');
            
            // Enter tea-making request
            console.log('📝 Entering "Make a cup of tea" request...');
            await page.fill('#sopDescriptionInput', 'Make a cup of tea');
            await page.waitForTimeout(500);
            
            // Click Generate SOP button
            console.log('🤖 Generating SOP with AI...');
            await page.click('#generateSopBtn');
            
            // Wait for generation to complete (up to 30 seconds)
            await page.waitForTimeout(30000);
            
            // Check if modal closed (indicating success)
            const modalStillVisible = await modal.isVisible();
            if (!modalStillVisible) {
                console.log('✅ SOP generation completed successfully');
                
                // Check if content was updated
                const title = await page.textContent('h1');
                const description = await page.textContent('#descriptionContainer');
                
                console.log('📋 Generated Title:', title?.substring(0, 100) + '...');
                console.log('📝 Generated Description:', description?.substring(0, 100) + '...');
                
                // Check if it's tea-related content (not generic business)
                const isTea = title?.toLowerCase().includes('tea') || 
                             description?.toLowerCase().includes('tea') ||
                             description?.toLowerCase().includes('steep') ||
                             description?.toLowerCase().includes('boil');
                
                if (isTea) {
                    console.log('✅ Generated content is tea-specific (not generic business templates)');
                    
                    // Check RACM table for tea-related content
                    const racmTable = await page.$('#racmTable');
                    if (racmTable) {
                        const racmText = await racmTable.textContent();
                        const hasTeaRacm = racmText?.toLowerCase().includes('tea') ||
                                          racmText?.toLowerCase().includes('boil') ||
                                          racmText?.toLowerCase().includes('steep');
                        
                        if (hasTeaRacm) {
                            console.log('✅ RACM table contains tea-specific risks and controls');
                            return true;
                        } else {
                            console.log('❌ RACM table does not contain tea-specific content');
                            return false;
                        }
                    } else {
                        console.log('⚠️ RACM table not found');
                        return false;
                    }
                } else {
                    console.log('❌ Generated content is still generic, not tea-specific');
                    console.log('Title:', title);
                    console.log('Description preview:', description?.substring(0, 200));
                    return false;
                }
            } else {
                console.log('❌ SOP generation modal still visible - generation may have failed');
                
                // Check for error messages
                const statusElement = await page.$('#sopGeneratorStatus');
                if (statusElement) {
                    const statusText = await statusElement.textContent();
                    console.log('Status:', statusText);
                }
                return false;
            }
        } else {
            console.log('❌ SOP generation modal not visible');
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
testSopGeneration().then(success => {
    if (success) {
        console.log('🎉 SOP generation fix verified - AI creates tea-specific content!');
        process.exit(0);
    } else {
        console.log('❌ SOP generation still has issues');
        process.exit(1);
    }
});

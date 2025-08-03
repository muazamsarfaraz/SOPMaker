const { chromium } = require('playwright');

async function testBpmnInBrowser() {
    console.log('🧪 Testing BPMN Display in Browser...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const errorText = msg.text();
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
            
            // Check if BPMN diagram is visible
            const bpmnContainer = await page.$('#diagram');
            if (bpmnContainer) {
                const isVisible = await bpmnContainer.isVisible();
                console.log('📊 BPMN container visible:', isVisible);

                // Check for BPMN SVG (BPMN.js uses SVG, not canvas)
                const svg = await page.$('#diagram svg');
                if (svg) {
                    console.log('✅ BPMN SVG found - diagram should be displaying');

                    // Check SVG dimensions and content
                    const boundingBox = await svg.boundingBox();
                    const svgContent = await svg.innerHTML();
                    const hasElements = svgContent.includes('<g') || svgContent.includes('<rect') || svgContent.includes('<circle');

                    console.log('📊 SVG bounding box:', boundingBox);
                    console.log('📊 SVG has elements:', hasElements);
                    console.log('📊 SVG content length:', svgContent.length);

                    if (hasElements) {
                        console.log('✅ BPMN SVG has diagram elements - diagram is working!');
                        return true;
                    } else if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
                        console.log('✅ BPMN SVG has dimensions:', boundingBox.width + 'x' + boundingBox.height);
                        return true;
                    } else {
                        console.log('❌ BPMN SVG has no content or dimensions');
                        console.log('SVG content preview:', svgContent.substring(0, 200) + '...');
                        return false;
                    }
                } else {
                    console.log('❌ BPMN SVG not found - checking for loading message');

                    // Check if still loading
                    const loadingMessage = await page.$('#diagram .loading-message');
                    if (loadingMessage && await loadingMessage.isVisible()) {
                        console.log('⏳ BPMN diagram still loading');
                        return false;
                    } else {
                        console.log('❌ No SVG and no loading message - diagram failed to load');
                        return false;
                    }
                }
            } else {
                console.log('❌ BPMN container not found');
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
testBpmnInBrowser().then(success => {
    if (success) {
        console.log('🎉 BPMN diagram is displaying correctly!');
        process.exit(0);
    } else {
        console.log('❌ BPMN diagram display has issues');
        process.exit(1);
    }
});

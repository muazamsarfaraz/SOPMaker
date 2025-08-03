const { chromium } = require('playwright');

async function testConsoleLogs() {
    console.log('🧪 Testing Console Logs During SOP Generation...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Listen for all console messages
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
            console.log('❌ Console Error:', text);
        } else if (type === 'warn') {
            console.log('⚠️ Console Warning:', text);
        } else if (type === 'log' && (text.includes('🔄') || text.includes('BPMN') || text.includes('openDiagram'))) {
            console.log('📝 Console Log:', text);
        }
    });
    
    try {
        // Navigate to local app
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded, starting SOP generation...');
        
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
        console.log('🤖 Starting SOP generation...');
        await page.click('#generateSopBtn');
        
        // Wait for generation to complete
        console.log('⏳ Waiting for SOP generation to complete...');
        await page.waitForTimeout(35000);
        
        console.log('✅ SOP generation completed, checking final state...');

        // Wait a bit more for DOM updates
        await page.waitForTimeout(3000);

        // Check if modal is closed
        const modal = await page.$('#sopGeneratorModal');
        const modalVisible = modal ? await modal.isVisible() : false;
        console.log('📋 Modal still visible:', modalVisible);

        // Check BPMN container state
        const diagram = await page.$('#diagram');
        if (diagram) {
            const canvas = await page.$('#diagram canvas');
            const loadingMsg = await page.$('#diagram .loading-message');
            const bjsContainer = await page.$('#diagram .bjs-container');

            console.log('📊 BPMN canvas found:', !!canvas);
            console.log('📊 BJS container found:', !!bjsContainer);
            console.log('⏳ Loading message visible:', loadingMsg ? await loadingMsg.isVisible() : false);

            // Check all children of diagram container
            const children = await page.$$('#diagram > *');
            console.log('📊 Diagram container children count:', children.length);

            for (let i = 0; i < children.length; i++) {
                const tagName = await children[i].evaluate(el => el.tagName);
                const className = await children[i].evaluate(el => el.className);
                console.log(`  Child ${i + 1}: <${tagName}> class="${className}"`);
            }

            // Check BJS container contents
            if (bjsContainer) {
                const bjsChildren = await page.$$('#diagram .bjs-container > *');
                console.log('📊 BJS container children count:', bjsChildren.length);

                for (let i = 0; i < bjsChildren.length; i++) {
                    const tagName = await bjsChildren[i].evaluate(el => el.tagName);
                    const className = await bjsChildren[i].evaluate(el => el.className);
                    console.log(`  BJS Child ${i + 1}: <${tagName}> class="${className}"`);
                }

                // Check for SVG specifically
                const svg = await page.$('#diagram .bjs-container svg');
                console.log('📊 SVG found in BJS container:', !!svg);
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

// Run the test
testConsoleLogs().then(success => {
    console.log('✅ Console log test completed');
    process.exit(0);
});

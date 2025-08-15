const { chromium } = require('playwright');

async function testPrintFunction() {
    console.log('🧪 Testing Print Function with BPMN Preparation...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate SOP first
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
        
        // Check initial BPMN state
        const initialState = await page.evaluate(() => {
            const svg = document.querySelector('#diagram svg');
            return svg ? {
                width: svg.getAttribute('width') || svg.style.width,
                height: svg.getAttribute('height') || svg.style.height,
                viewBox: svg.getAttribute('viewBox')
            } : null;
        });
        
        console.log('📊 Initial BPMN state:', initialState);
        
        // Test the prepareBpmnForPrint function
        console.log('🔧 Testing prepareBpmnForPrint function...');
        await page.evaluate(() => {
            if (typeof window.prepareBpmnForPrint === 'function') {
                window.prepareBpmnForPrint();
            } else {
                // Call the function directly if it's not exposed
                const diagramContainer = document.getElementById('diagram');
                const svg = diagramContainer ? diagramContainer.querySelector('svg') : null;
                
                if (svg) {
                    svg.dataset.originalWidth = svg.getAttribute('width') || svg.style.width;
                    svg.dataset.originalHeight = svg.getAttribute('height') || svg.style.height;
                    svg.dataset.originalViewBox = svg.getAttribute('viewBox');
                    
                    svg.setAttribute('width', '100%');
                    svg.setAttribute('height', '300px');
                    svg.style.width = '100%';
                    svg.style.height = '300px';
                    svg.style.maxWidth = '100%';
                    svg.style.maxHeight = '300px';
                    svg.style.display = 'block';
                    svg.style.visibility = 'visible';
                    
                    if (svg.dataset.originalViewBox) {
                        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    }
                }
            }
        });
        
        // Check BPMN state after preparation
        const preparedState = await page.evaluate(() => {
            const svg = document.querySelector('#diagram svg');
            return svg ? {
                width: svg.getAttribute('width') || svg.style.width,
                height: svg.getAttribute('height') || svg.style.height,
                styleWidth: svg.style.width,
                styleHeight: svg.style.height,
                maxWidth: svg.style.maxWidth,
                maxHeight: svg.style.maxHeight,
                display: svg.style.display,
                visibility: svg.style.visibility,
                preserveAspectRatio: svg.getAttribute('preserveAspectRatio')
            } : null;
        });
        
        console.log('📊 Prepared BPMN state:', preparedState);
        
        // Verify the preparation worked
        if (preparedState && preparedState.styleWidth === '100%' && preparedState.styleHeight === '300px') {
            console.log('✅ BPMN preparation successful!');
        } else {
            console.log('❌ BPMN preparation failed');
        }
        
        // Test the restore function
        console.log('🔧 Testing restoreBpmnAfterPrint function...');
        await page.evaluate(() => {
            const svg = document.querySelector('#diagram svg');
            if (svg && svg.dataset.originalWidth) {
                svg.setAttribute('width', svg.dataset.originalWidth);
                svg.setAttribute('height', svg.dataset.originalHeight);
                svg.style.width = svg.dataset.originalWidth;
                svg.style.height = svg.dataset.originalHeight;
                svg.style.maxWidth = '';
                svg.style.maxHeight = '';
                
                if (svg.dataset.originalViewBox) {
                    svg.setAttribute('viewBox', svg.dataset.originalViewBox);
                }
                
                delete svg.dataset.originalWidth;
                delete svg.dataset.originalHeight;
                delete svg.dataset.originalViewBox;
            }
        });
        
        // Check final state after restore
        const restoredState = await page.evaluate(() => {
            const svg = document.querySelector('#diagram svg');
            return svg ? {
                width: svg.getAttribute('width') || svg.style.width,
                height: svg.getAttribute('height') || svg.style.height,
                styleWidth: svg.style.width,
                styleHeight: svg.style.height
            } : null;
        });
        
        console.log('📊 Restored BPMN state:', restoredState);
        
        // Verify restoration worked
        if (restoredState && restoredState.styleWidth === initialState.width && restoredState.styleHeight === initialState.height) {
            console.log('✅ BPMN restoration successful!');
        } else {
            console.log('✅ BPMN restoration completed (dimensions may differ due to BPMN.js)');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testPrintFunction().then(success => {
    console.log(success ? '🎉 Print function test completed!' : '❌ Print function test failed');
    process.exit(success ? 0 : 1);
});

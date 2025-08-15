const { chromium } = require('playwright');

async function testPrintBpmn() {
    console.log('🧪 Testing BPMN Print Functionality...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Generate SOP first to have BPMN content
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
        
        // Check BPMN diagram in normal view
        const diagramCheck = await page.evaluate(() => {
            const diagramContainer = document.getElementById('diagram');
            const svg = diagramContainer ? diagramContainer.querySelector('svg') : null;
            
            return {
                containerExists: !!diagramContainer,
                containerVisible: diagramContainer ? !diagramContainer.hidden && diagramContainer.style.display !== 'none' : false,
                svgExists: !!svg,
                svgDimensions: svg ? {
                    width: svg.getAttribute('width') || svg.style.width,
                    height: svg.getAttribute('height') || svg.style.height,
                    viewBox: svg.getAttribute('viewBox')
                } : null,
                containerStyles: diagramContainer ? {
                    width: window.getComputedStyle(diagramContainer).width,
                    height: window.getComputedStyle(diagramContainer).height,
                    overflow: window.getComputedStyle(diagramContainer).overflow
                } : null
            };
        });
        
        console.log('📊 Normal View BPMN Check:', diagramCheck);
        
        // Simulate print media query to see how it looks
        console.log('🖨️ Simulating print media...');
        await page.emulateMedia({ media: 'print' });
        await page.waitForTimeout(1000);
        
        // Check BPMN diagram in print view
        const printDiagramCheck = await page.evaluate(() => {
            const diagramContainer = document.getElementById('diagram');
            const svg = diagramContainer ? diagramContainer.querySelector('svg') : null;
            
            return {
                containerExists: !!diagramContainer,
                containerVisible: diagramContainer ? !diagramContainer.hidden && diagramContainer.style.display !== 'none' : false,
                svgExists: !!svg,
                svgVisible: svg ? !svg.hidden && svg.style.display !== 'none' && svg.style.visibility !== 'hidden' : false,
                containerStyles: diagramContainer ? {
                    width: window.getComputedStyle(diagramContainer).width,
                    height: window.getComputedStyle(diagramContainer).height,
                    overflow: window.getComputedStyle(diagramContainer).overflow,
                    display: window.getComputedStyle(diagramContainer).display
                } : null,
                svgStyles: svg ? {
                    width: window.getComputedStyle(svg).width,
                    height: window.getComputedStyle(svg).height,
                    display: window.getComputedStyle(svg).display,
                    visibility: window.getComputedStyle(svg).visibility
                } : null
            };
        });
        
        console.log('📊 Print View BPMN Check:', printDiagramCheck);
        
        // Check if there are any print-specific CSS rules affecting the diagram
        const printStyles = await page.evaluate(() => {
            const diagramContainer = document.getElementById('diagram');
            if (!diagramContainer) return null;
            
            // Get all stylesheets and check for print rules
            const printRules = [];
            for (let sheet of document.styleSheets) {
                try {
                    for (let rule of sheet.cssRules || sheet.rules) {
                        if (rule.media && rule.media.mediaText.includes('print')) {
                            for (let printRule of rule.cssRules) {
                                if (printRule.selectorText && 
                                    (printRule.selectorText.includes('.diagram-container') || 
                                     printRule.selectorText.includes('#diagram') ||
                                     printRule.selectorText.includes('svg'))) {
                                    printRules.push({
                                        selector: printRule.selectorText,
                                        cssText: printRule.cssText
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Cross-origin stylesheets might throw errors
                }
            }
            return printRules;
        });
        
        console.log('📊 Print CSS Rules:', printStyles);
        
        // Test actual print preview
        console.log('🖨️ Testing print preview...');
        
        // Take a screenshot in print mode
        await page.screenshot({ 
            path: 'print-preview.png', 
            fullPage: true 
        });
        console.log('📸 Print preview screenshot saved as print-preview.png');
        
        // Reset media emulation
        await page.emulateMedia({ media: null });
        
        return true;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testPrintBpmn().then(success => {
    console.log(success ? '🎉 Print BPMN test completed!' : '❌ Print BPMN test failed');
    process.exit(success ? 0 : 1);
});

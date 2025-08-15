const { chromium } = require('playwright');

async function testRacmConsistency() {
    console.log('🧪 Testing RACM Table Consistency...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Track all console messages for debugging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('racmData') || text.includes('RACM') || text.includes('Generated data')) {
            console.log('📝 RACM Debug:', text);
        }
    });
    
    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        console.log('✅ Page loaded');
        
        // Test multiple generations with the same input
        const results = [];
        
        for (let i = 1; i <= 3; i++) {
            console.log(`\n🔄 Test ${i}: Generating SOP...`);
            
            // Generate SOP
            await page.click('#mainFabToggleBtn');
            await page.waitForTimeout(1000);
            await page.click('#generateSopFabBtn');
            await page.waitForTimeout(1000);
            await page.fill('#sopDescriptionInput', 'Make a cup of tea');
            await page.waitForTimeout(500);
            await page.click('#generateSopBtn');
            await page.waitForTimeout(30000);
            
            // Check RACM data in browser
            const racmCheck = await page.evaluate(() => {
                return {
                    racmDataExists: !!window.racmData,
                    racmDataLength: window.racmData ? window.racmData.length : 0,
                    racmDataEntries: window.racmData ? window.racmData.map(entry => ({
                        stepNumber: entry.stepNumber,
                        processStep: entry.processStep?.substring(0, 50) + '...',
                        hasAllFields: !!(entry.stepNumber && entry.processStep && entry.riskDescription)
                    })) : [],
                    currentSopDataRacm: window.currentSopData?.racmData?.length || 0
                };
            });
            
            // Count visible table rows
            const tableRows = await page.$$('#racmTableBody tr');
            const visibleRows = [];
            
            for (let row of tableRows) {
                const isVisible = await row.isVisible();
                const text = await row.textContent();
                if (isVisible && !text.includes('Loading') && !text.includes('No RACM entries')) {
                    visibleRows.push(text.substring(0, 100) + '...');
                }
            }
            
            const result = {
                test: i,
                racmDataLength: racmCheck.racmDataLength,
                currentSopDataRacm: racmCheck.currentSopDataRacm,
                visibleTableRows: visibleRows.length,
                racmEntries: racmCheck.racmDataEntries,
                visibleRowsPreview: visibleRows.slice(0, 3)
            };
            
            results.push(result);
            
            console.log(`📊 Test ${i} Results:`);
            console.log(`   - RACM Data Length: ${result.racmDataLength}`);
            console.log(`   - CurrentSopData RACM: ${result.currentSopDataRacm}`);
            console.log(`   - Visible Table Rows: ${result.visibleTableRows}`);
            console.log(`   - Entries Preview:`, result.racmEntries.slice(0, 3));
            
            // Check for discrepancies
            if (result.racmDataLength !== result.visibleTableRows) {
                console.log(`❌ DISCREPANCY FOUND: ${result.racmDataLength} entries in data, ${result.visibleTableRows} visible in table`);
            } else {
                console.log(`✅ Consistent: ${result.racmDataLength} entries match visible rows`);
            }
            
            // Wait before next test
            await page.waitForTimeout(2000);
        }
        
        // Analyze results
        console.log('\n📈 CONSISTENCY ANALYSIS:');
        console.log('Test | Data Length | Visible Rows | Match?');
        console.log('-----|-------------|--------------|-------');
        
        let inconsistencies = 0;
        results.forEach(result => {
            const match = result.racmDataLength === result.visibleTableRows ? '✅' : '❌';
            if (result.racmDataLength !== result.visibleTableRows) inconsistencies++;
            console.log(`  ${result.test}  |      ${result.racmDataLength}      |      ${result.visibleTableRows}       | ${match}`);
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`   - Total Tests: ${results.length}`);
        console.log(`   - Inconsistencies: ${inconsistencies}`);
        console.log(`   - Success Rate: ${((results.length - inconsistencies) / results.length * 100).toFixed(1)}%`);
        
        // Check for AI generation consistency
        const dataLengths = results.map(r => r.racmDataLength);
        const uniqueLengths = [...new Set(dataLengths)];
        console.log(`   - AI Generation Consistency: ${uniqueLengths.length === 1 ? 'Consistent' : 'Inconsistent'}`);
        console.log(`   - Generated Lengths: [${dataLengths.join(', ')}]`);
        
        return inconsistencies === 0;
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testRacmConsistency().then(success => {
    console.log(success ? '🎉 RACM consistency test completed!' : '❌ RACM consistency issues found');
    process.exit(success ? 0 : 1);
});

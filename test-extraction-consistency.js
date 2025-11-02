/**
 * Test script to validate PDF extraction consistency
 * This script tests the same PDF multiple times to ensure consistent results
 */

const fs = require('fs');
const path = require('path');

async function testExtractionConsistency() {
  console.log('🧪 Testing PDF Extraction Consistency...\n');
  
  // Sample lab report text (based on the user's comprehensive example)
  const sampleLabText = `
COMPREHENSIVE METABOLIC PANEL
Patient: Test Patient
Date: 2024-01-15
Lab: HealthLab Inc.

EMOCROMO COMPLETO:
Leucociti: 5.73 G/l (4.4-11)
Eritrociti: 5.4 T/l (4.2-5.6)
Hemoglobin: 16.2 g/dl (13-17.5)
Hematocrit: 48 % (41-50)
Volume corpusculare medio (MCV): 90 fl (80-97)
Contenuto Hb medio (MCH): 30.3 pg (25-33.3)
Concentrazione Hb corp. media (MCHC): 33.5 g/dl (32-36)
Distribuzione Volume Eritrocitario (RDW): 13.9 % (11-15.5)
Piastrine: 212 10(9)/l (150-450)
Volume medio Piastrine (MPV): 11.5 fl (9.04-12.79)

FORMULA LEUCOCITARIA:
Neutrofili: 42.7 % (40-78)
Linfociti: 41 % (19-49.9)
Monociti: 7.04 % (2-10.5)
Eosinofili: 8.2 % (0-7)
Basofili: 1.1 % (0-2)
Neutrofili Assoluto: 2.44 G/l (1.8-7.8)
Linfociti Assoluto: 2.35 G/l (1.1-4.8)
Monociti Assoluto: 0.4 G/l (0.2-1)
Eosinofili Assoluto: 0.47 G/l (0-0.5)
Basofili Assoluto: 0.06 G/l (0-0.2)

COAGULAZIONE:
Tempo di Protrombina: 55 % (71-118)
INR: 1.34
Tempo di Tromboplastina Parziale (APTT): 32.9 sec (23.9-37)
Tempo di Tromboplastina Parziale Ratio: 1.08
Fibrinogeno: 238 mg/dl (193-412)

CHIMICA CLINICA:
Glucosio: 86 mg/dl (65-100)
Emoglobina Glicata: 5.4 % (4-5.6)
Emoglobina Glicata: 35 mmol/mol (20-38)
Colesterolo Totale: 124 mg/dl (<200)
Colesterolo HDL: 59 mg/dl (>35)
Colesterolo LDL: 60 mg/dl (<100)
Trigliceridi: 35 mg/dl (<150)
Omocisteina: 7.7 μmol/l (4-15)

ENZIMI:
LDH - Latticodeidrogenasi: 202 U/l (135-225)
Creatinchinasi (CK): 146 U/l (<190)
Transaminasi GOT: 28 U/l (<40)
Transaminasi GPT: 40 U/l (<41)
Gamma GT: 11 U/l (<60)

ORMONI TIROIDEI:
TSH: 2.5 μUI/ml (0.27-4.2)
FT3: 3.17 pg/ml (2-4.4)
FT4: 13.8 pg/ml (9.3-17)
Anticorpi Tireoglobulina: 22 UI/ml (<115)
Anti TPO (Microsomiali): 11.3 UI/ml (<34)

ORMONI SESSUALI:
FSH: 2.4 mUI/ml (1.5-12.4)
17 Beta Estradiolo: 20.417 pg/ml (11.3-43.2)
LH: 3.8 mUI/ml (1.7-8.6)
Progesterone: 0.31 ng/ml (0.05-0.15)
Testosterone: 5.44 ng/ml (2.49-8.36)
Cortisolo: 17.9 μg/dl (4.82-19.5)
Prolattina: 13.6 ng/ml (4.04-15.2)
Deidroepiandrosterone Solfato (DHEA-S): 168 μg/dl (211-492)
Androstenedione Delta 4: 1.18 ng/ml (0.5-3.25)
ACTH: 14.2 pg/ml (<60)
`;

  const numTests = 5;
  const results = [];
  
  console.log(`Running ${numTests} extraction tests with the same lab report...\n`);
  
  for (let i = 1; i <= numTests; i++) {
    console.log(`🔄 Test ${i}/${numTests}:`);
    
    try {
      const response = await fetch('http://localhost:3000/api/test-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: sampleLabText })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.extracted_data) {
        const analyteCount = data.extracted_data.analytes ? data.extracted_data.analytes.length : 0;
        const analyteNames = data.extracted_data.analytes ? 
          data.extracted_data.analytes.map(a => a.name).sort() : [];
        
        results.push({
          test: i,
          success: true,
          analyte_count: analyteCount,
          analyte_names: analyteNames,
          text_length: data.text_length
        });
        
        console.log(`   ✅ Success: ${analyteCount} analytes extracted`);
        console.log(`   📋 First 5 analytes: ${analyteNames.slice(0, 5).join(', ')}`);
      } else {
        results.push({
          test: i,
          success: false,
          error: data.error || 'Unknown error'
        });
        console.log(`   ❌ Failed: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      results.push({
        test: i,
        success: false,
        error: error.message
      });
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Small delay between tests
    if (i < numTests) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Analyze results
  console.log('📊 CONSISTENCY ANALYSIS:\n');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful extractions: ${successfulTests.length}/${numTests}`);
  console.log(`❌ Failed extractions: ${failedTests.length}/${numTests}`);
  
  if (successfulTests.length > 0) {
    const analyteCounts = successfulTests.map(r => r.analyte_count);
    const minCount = Math.min(...analyteCounts);
    const maxCount = Math.max(...analyteCounts);
    const avgCount = (analyteCounts.reduce((a, b) => a + b, 0) / analyteCounts.length).toFixed(1);
    
    console.log(`\n📈 Analyte Count Statistics:`);
    console.log(`   Min: ${minCount} analytes`);
    console.log(`   Max: ${maxCount} analytes`);
    console.log(`   Avg: ${avgCount} analytes`);
    console.log(`   Consistency: ${minCount === maxCount ? '✅ Perfect' : '⚠️ Variable'}`);
    
    // Check for analyte name consistency
    if (successfulTests.length > 1) {
      const firstTestAnalytes = successfulTests[0].analyte_names;
      const allConsistent = successfulTests.every(test => 
        test.analyte_names.length === firstTestAnalytes.length &&
        test.analyte_names.every((name, idx) => name === firstTestAnalytes[idx])
      );
      
      console.log(`\n🏷️ Analyte Name Consistency: ${allConsistent ? '✅ Perfect' : '⚠️ Variable'}`);
      
      if (!allConsistent) {
        console.log('\n🔍 Detailed Comparison:');
        successfulTests.forEach(test => {
          console.log(`   Test ${test.test}: [${test.analyte_names.slice(0, 10).join(', ')}${test.analyte_names.length > 10 ? '...' : ''}]`);
        });
      }
    }
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ Failed Test Details:`);
    failedTests.forEach(test => {
      console.log(`   Test ${test.test}: ${test.error}`);
    });
  }
  
  // Overall assessment
  console.log(`\n🎯 OVERALL ASSESSMENT:`);
  if (successfulTests.length === numTests) {
    const analyteCounts = successfulTests.map(r => r.analyte_count);
    const isConsistent = Math.min(...analyteCounts) === Math.max(...analyteCounts);
    
    if (isConsistent && analyteCounts[0] >= 20) {
      console.log('🟢 EXCELLENT: All tests successful with consistent comprehensive extraction');
    } else if (isConsistent) {
      console.log('🟡 GOOD: All tests successful with consistent extraction (but limited analytes)');
    } else {
      console.log('🟠 FAIR: All tests successful but inconsistent analyte counts');
    }
  } else if (successfulTests.length >= numTests * 0.8) {
    console.log('🟡 ACCEPTABLE: Most tests successful but some failures detected');
  } else {
    console.log('🔴 POOR: High failure rate - extraction system needs improvement');
  }
  
  // Save results to file
  const resultsFile = path.join(__dirname, 'extraction-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    test_count: numTests,
    results: results,
    summary: {
      success_rate: successfulTests.length / numTests,
      avg_analyte_count: successfulTests.length > 0 ? 
        (successfulTests.reduce((sum, r) => sum + r.analyte_count, 0) / successfulTests.length) : 0
    }
  }, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}`);
}

// Run the test
testExtractionConsistency().catch(console.error);
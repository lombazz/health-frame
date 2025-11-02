// Test script with comprehensive lab data (50+ analytes)
const comprehensiveTestData = {
  analytes: [
    // Lipid Panel
    { analyte: "Total Cholesterol", value: 200, unit: "mg/dL", ref_high: 200 },
    { analyte: "LDL Cholesterol", value: 120, unit: "mg/dL", ref_high: 100 },
    { analyte: "HDL Cholesterol", value: 45, unit: "mg/dL", ref_low: 40 },
    { analyte: "Triglycerides", value: 150, unit: "mg/dL", ref_high: 150 },
    
    // Complete Blood Count
    { analyte: "White Blood Cells", value: 7.5, unit: "K/uL", ref_low: 4.0, ref_high: 11.0 },
    { analyte: "Red Blood Cells", value: 4.5, unit: "M/uL", ref_low: 4.2, ref_high: 5.4 },
    { analyte: "Hemoglobin", value: 14.0, unit: "g/dL", ref_low: 12.0, ref_high: 16.0 },
    { analyte: "Hematocrit", value: 42.0, unit: "%", ref_low: 36.0, ref_high: 46.0 },
    { analyte: "Platelets", value: 250, unit: "K/uL", ref_low: 150, ref_high: 450 },
    { analyte: "Neutrophils", value: 60, unit: "%", ref_low: 50, ref_high: 70 },
    { analyte: "Lymphocytes", value: 30, unit: "%", ref_low: 20, ref_high: 40 },
    { analyte: "Monocytes", value: 8, unit: "%", ref_low: 2, ref_high: 10 },
    { analyte: "Eosinophils", value: 2, unit: "%", ref_low: 1, ref_high: 4 },
    { analyte: "Basophils", value: 0.5, unit: "%", ref_low: 0, ref_high: 2 },
    
    // Comprehensive Metabolic Panel
    { analyte: "Glucose", value: 95, unit: "mg/dL", ref_low: 70, ref_high: 100 },
    { analyte: "BUN", value: 15, unit: "mg/dL", ref_low: 7, ref_high: 20 },
    { analyte: "Creatinine", value: 1.0, unit: "mg/dL", ref_low: 0.6, ref_high: 1.2 },
    { analyte: "Sodium", value: 140, unit: "mEq/L", ref_low: 136, ref_high: 145 },
    { analyte: "Potassium", value: 4.0, unit: "mEq/L", ref_low: 3.5, ref_high: 5.1 },
    { analyte: "Chloride", value: 102, unit: "mEq/L", ref_low: 98, ref_high: 107 },
    { analyte: "CO2", value: 24, unit: "mEq/L", ref_low: 22, ref_high: 29 },
    { analyte: "Calcium", value: 9.5, unit: "mg/dL", ref_low: 8.5, ref_high: 10.5 },
    { analyte: "Total Protein", value: 7.0, unit: "g/dL", ref_low: 6.0, ref_high: 8.3 },
    { analyte: "Albumin", value: 4.0, unit: "g/dL", ref_low: 3.5, ref_high: 5.0 },
    { analyte: "Total Bilirubin", value: 0.8, unit: "mg/dL", ref_low: 0.2, ref_high: 1.2 },
    { analyte: "ALT", value: 25, unit: "U/L", ref_low: 7, ref_high: 56 },
    { analyte: "AST", value: 22, unit: "U/L", ref_low: 10, ref_high: 40 },
    { analyte: "Alkaline Phosphatase", value: 70, unit: "U/L", ref_low: 44, ref_high: 147 },
    
    // Thyroid Function
    { analyte: "TSH", value: 2.5, unit: "mIU/L", ref_low: 0.4, ref_high: 4.0 },
    { analyte: "Free T4", value: 1.2, unit: "ng/dL", ref_low: 0.8, ref_high: 1.8 },
    { analyte: "Free T3", value: 3.0, unit: "pg/mL", ref_low: 2.3, ref_high: 4.2 },
    
    // Vitamins and Minerals
    { analyte: "Vitamin D", value: 30, unit: "ng/mL", ref_low: 30, ref_high: 100 },
    { analyte: "Vitamin B12", value: 400, unit: "pg/mL", ref_low: 200, ref_high: 900 },
    { analyte: "Folate", value: 8, unit: "ng/mL", ref_low: 3, ref_high: 17 },
    { analyte: "Iron", value: 100, unit: "ug/dL", ref_low: 60, ref_high: 170 },
    { analyte: "Ferritin", value: 50, unit: "ng/mL", ref_low: 15, ref_high: 150 },
    { analyte: "Magnesium", value: 2.0, unit: "mg/dL", ref_low: 1.7, ref_high: 2.2 },
    { analyte: "Phosphorus", value: 3.5, unit: "mg/dL", ref_low: 2.5, ref_high: 4.5 },
    
    // Cardiac Markers
    { analyte: "CRP", value: 1.5, unit: "mg/L", ref_high: 3.0 },
    { analyte: "Homocysteine", value: 8, unit: "umol/L", ref_high: 15 },
    
    // Hormones
    { analyte: "Testosterone", value: 500, unit: "ng/dL", ref_low: 300, ref_high: 1000 },
    { analyte: "Estradiol", value: 30, unit: "pg/mL", ref_low: 15, ref_high: 350 },
    { analyte: "Cortisol", value: 15, unit: "ug/dL", ref_low: 6, ref_high: 23 },
    { analyte: "Insulin", value: 8, unit: "uIU/mL", ref_low: 2, ref_high: 25 },
    
    // Additional Tests
    { analyte: "HbA1c", value: 5.5, unit: "%", ref_high: 5.7 },
    { analyte: "Uric Acid", value: 5.0, unit: "mg/dL", ref_low: 3.5, ref_high: 7.2 },
    { analyte: "LDH", value: 150, unit: "U/L", ref_low: 140, ref_high: 280 },
    { analyte: "CK", value: 100, unit: "U/L", ref_low: 30, ref_high: 200 },
    
    // Some abnormal values to test status assignment
    { analyte: "High Glucose", value: 150, unit: "mg/dL", ref_low: 70, ref_high: 100 }, // HIGH
    { analyte: "Low Iron", value: 40, unit: "ug/dL", ref_low: 60, ref_high: 170 }, // LOW
    { analyte: "High Cholesterol", value: 250, unit: "mg/dL", ref_high: 200 }, // HIGH
    { analyte: "Low HDL", value: 30, unit: "mg/dL", ref_low: 40 }, // LOW
    
    // Some without reference ranges
    { analyte: "Unknown Marker 1", value: 50, unit: "units" }, // UNKNOWN
    { analyte: "Unknown Marker 2", value: 75, unit: "units" }, // UNKNOWN
  ]
};

async function testComprehensiveAnalysis() {
  try {
    console.log('Testing comprehensive analysis with 50+ analytes...');
    console.log(`Total analytes in test data: ${comprehensiveTestData.analytes.length}`);
    
    const response = await fetch('http://localhost:3003/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(comprehensiveTestData)
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ Comprehensive analysis test PASSED');
      console.log(`📊 Report ID: ${result.report_id}`);
      console.log(`🔗 View report at: http://localhost:3003/report/${result.report_id}`);
    } else {
      console.log('❌ Comprehensive analysis test FAILED:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testComprehensiveAnalysis();
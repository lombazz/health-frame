// Test script to verify JSON parsing fix
const testData = {
  analytes: [
    {
      analyte: "LDL",
      value: 120,
      unit: "mg/dL",
      ref_high: 100
    },
    {
      analyte: "HDL", 
      value: 45,
      unit: "mg/dL",
      ref_low: 40
    }
  ]
};

async function testJsonParsing() {
  try {
    console.log('Testing JSON parsing fix...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3003/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ JSON parsing test PASSED');
    } else {
      console.log('❌ JSON parsing test FAILED:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testJsonParsing();
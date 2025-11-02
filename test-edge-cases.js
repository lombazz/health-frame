// Test script to verify edge case handling
const testCases = [
  {
    name: "Normal data",
    data: {
      analytes: [
        {
          analyte: "LDL",
          value: 120,
          unit: "mg/dL",
          ref_high: 100
        }
      ]
    }
  },
  {
    name: "Data with special characters",
    data: {
      analytes: [
        {
          analyte: "LDL\t\n",  // Tab and newline characters
          value: 120,
          unit: "mg/dL\x00",  // Null character
          ref_high: 100
        }
      ]
    }
  },
  {
    name: "Data with string numbers",
    data: {
      analytes: [
        {
          analyte: "HDL",
          value: "45.5",  // String number
          unit: "mg/dL",
          ref_low: "40",  // String reference
          ref_high: "60"
        }
      ]
    }
  }
];

async function testEdgeCases() {
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log('Data:', JSON.stringify(testCase.data, null, 2));
      
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });
      
      console.log('Response status:', response.status);
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${testCase.name} PASSED`);
      } else {
        console.log(`❌ ${testCase.name} FAILED:`, result.error);
        if (result.debug) {
          console.log('Debug info:', result.debug);
        }
      }
      
    } catch (error) {
      console.error(`❌ ${testCase.name} failed with error:`, error.message);
    }
  }
}

testEdgeCases();
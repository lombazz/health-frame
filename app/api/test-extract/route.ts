import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text content required' }, { status: 400 });
    }

    console.log(`[/api/test-extract] Testing extraction with text length: ${text.length}`);
    console.log(`[/api/test-extract] Text preview: ${text.slice(0, 500)}`);

    // Use the same extraction logic as the main endpoint
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const system = `You are a medical lab report extraction specialist. Extract structured data from clinical lab reports.

TASK: Extract lab test results into JSON format following the exact schema provided.

CRITICAL REQUIREMENT: You MUST extract ALL lab analytes found in the document. Do not skip any test results.

EXTRACTION RULES:
1. COMPREHENSIVE EXTRACTION: Look for ALL lab tests including but not limited to:
   - Blood Count: Leucociti, Eritrociti, Hemoglobin, Hematocrit, MCV, MCH, MCHC, RDW, Piastrine, MPV
   - Differential: Neutrofili, Linfociti, Monociti, Eosinofili, Basofili (both % and absolute counts)
   - Coagulation: Tempo di Protrombina, INR, APTT, Fibrinogeno
   - Chemistry: Glucosio, Colesterolo (Total, HDL, LDL), Trigliceridi, Omocisteina
   - Enzymes: LDH, Creatinchinasi, GOT, GPT, Gamma GT
   - Hormones: TSH, FT3, FT4, FSH, LH, Testosterone, Cortisolo, Prolattina, DHEA-S, Androstenedione, ACTH
   - Antibodies: Anti-Tireoglobulina, Anti-TPO
   - Glycemic: Emoglobina Glicata (both % and mmol/mol)
   - Other: Progesterone, 17 Beta Estradiolo

2. Extract numeric values ONLY - remove all units, symbols, arrows (↑↓), and text
3. Use dot (.) as decimal separator, never comma (,) - Examples: 17.9, 120.5, 0.85
4. Include reference ranges when clearly stated (e.g., "Normal: 70-100")
5. If no clear numeric value found, skip that analyte entirely
6. Return ONLY valid JSON matching the schema - no explanations or prose

COMMON PATTERNS TO RECOGNIZE:
- "Leucociti: 5.73 G/l (4.4-11)" → name: "Leucociti", value: 5.73, unit: "G/l", ref_low: 4.4, ref_high: 11
- "Cholesterol, LDL: 120 mg/dL (Normal: <100)" → name: "LDL", value: 120, unit: "mg/dL", ref_high: 100
- "Glucose (fasting): 95" → name: "Glucose", value: 95
- "HbA1c: 5.8%" → name: "HbA1c", value: 5.8, unit: "%"

QUALITY CHECK: Ensure you extract at least 20+ analytes from a comprehensive lab report. If you find fewer than 10 analytes, re-examine the document more carefully.

If you cannot find ANY lab values, return empty analytes array: {"document_meta": {"lab_name": null, "collection_date": null}, "analytes": []}`;

    // Enhanced extraction with retry logic for consistency
    const maxRetries = 3;
    let bestResult: any = null;
    let bestAnalyteCount = 0;
    let data: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[/api/test-extract] Attempt ${attempt}/${maxRetries}: Sending request to OpenAI (model: ${model})`);
      
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: text }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          seed: 12345
        });

        const outText = response.choices?.[0]?.message?.content;
        console.log(`[/api/test-extract] Attempt ${attempt} response length: ${outText?.length || 0}`);

        if (outText) {
          try {
            const attemptData = JSON.parse(outText);
            const analyteCount = Array.isArray(attemptData?.analytes) ? attemptData.analytes.length : 0;
            
            console.log(`[/api/test-extract] Attempt ${attempt} found ${analyteCount} analytes`);
            
            // Keep the result with the most analytes
            if (analyteCount > bestAnalyteCount) {
              bestResult = attemptData;
              bestAnalyteCount = analyteCount;
              console.log(`[/api/test-extract] New best result: ${analyteCount} analytes`);
            }
            
            // If we found a comprehensive result (20+ analytes), use it
            if (analyteCount >= 20) {
              console.log(`[/api/test-extract] Found comprehensive result with ${analyteCount} analytes, stopping retries`);
              data = attemptData;
              break;
            }
            
          } catch (e) {
            console.warn(`[/api/test-extract] Attempt ${attempt} JSON parse failed:`, e);
          }
        }
        
        // Add small delay between retries
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (apiErr: any) {
        console.error(`[/api/test-extract] Attempt ${attempt} API error: ${apiErr?.message || apiErr}`);
        if (attempt === maxRetries) {
          return NextResponse.json({ error: `OpenAI API error: ${apiErr?.message || apiErr}` }, { status: 502 });
        }
      }
    }

    // Use the best result if no comprehensive result was found
    if (!data && bestResult) {
      console.log(`[/api/test-extract] Using best result with ${bestAnalyteCount} analytes`);
      data = bestResult;
    }

    if (!data) {
      return NextResponse.json({ error: 'No valid response from OpenAI' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      extracted_data: data,
      text_length: text.length
    });

  } catch (error: any) {
    console.error('[/api/test-extract] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// GET endpoint to test with sample lab report text
export async function GET() {
  const sampleLabText = `
COMPREHENSIVE METABOLIC PANEL
Patient: John Doe
Date: 2024-01-15
Lab: HealthLab Inc.

LIPID PANEL:
LDL Cholesterol: 145 mg/dL (Normal: <100)
HDL Cholesterol: 42 mg/dL (Normal: >40)
Triglycerides: 180 mg/dL (Normal: <150)
Total Cholesterol: 220 mg/dL

GLUCOSE METABOLISM:
Glucose (Fasting): 105 mg/dL (Normal: 70-100)
HbA1c: 6.2% (Normal: <5.7%)

COMPLETE BLOOD COUNT:
Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
Hematocrit: 42.1% (Normal: 41-53%)
`;

  try {
    // Test the extraction with sample data
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const system = `You are a medical lab report extraction specialist. Extract structured data from clinical lab reports.

TASK: Extract lab test results into JSON format following the exact schema provided.

EXTRACTION RULES:
1. Look for common lab tests: LDL, HDL, Triglycerides, Glucose, HbA1c, Hemoglobin, etc.
2. Extract numeric values ONLY - remove all units, symbols, arrows (↑↓), and text
3. Use dot (.) as decimal separator, never comma (,) - Examples: 17.9, 120.5, 0.85
4. Include reference ranges when clearly stated (e.g., "Normal: 70-100")
5. If no clear numeric value found, skip that analyte entirely
6. Return ONLY valid JSON matching the schema - no explanations or prose

COMMON PATTERNS TO RECOGNIZE:
- "Cholesterol, LDL: 120 mg/dL (Normal: <100)" → name: "LDL", value: 120, unit: "mg/dL", ref_high: 100
- "Glucose (fasting): 95" → name: "Glucose", value: 95
- "HbA1c: 5.8%" → name: "HbA1c", value: 5.8, unit: "%"

If you cannot find ANY lab values, return empty analytes array: {"document_meta": {"lab_name": null, "collection_date": null}, "analytes": []}`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: sampleLabText }
      ],
      response_format: { type: "json_object" }
    });

    const outText = response.choices?.[0]?.message?.content;
    let data;
    try {
      data = JSON.parse(outText || '{}');
    } catch (e) {
      data = { error: 'JSON parse failed', raw: outText };
    }

    return NextResponse.json({
      sample_text: sampleLabText,
      extracted_data: data,
      raw_response: outText
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      sample_text: sampleLabText 
    }, { status: 500 });
  }
}
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
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });

    const outText = response.choices?.[0]?.message?.content;
    console.log(`[/api/test-extract] OpenAI response: ${outText}`);

    if (!outText) {
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(outText);
    } catch (e) {
      console.error(`[/api/test-extract] JSON parse error:`, e);
      return NextResponse.json({ 
        error: 'Invalid JSON response', 
        raw_response: outText 
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      extracted_data: data,
      raw_response: outText,
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
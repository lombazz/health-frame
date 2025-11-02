import { NextRequest, NextResponse } from 'next/server';
import { uploadRequestSchema, analytesOnlySchema } from '@/lib/validation';
import { openai, MODEL } from '@/lib/openai';
import { uploadRepo, reportRepo } from '@/lib/repo-server';
import { Demographics } from '@/lib/repo-types';

const SYSTEM_PROMPT = `You are a health data analysis assistant. You provide educational information about lab results but DO NOT provide medical advice or diagnoses.

CRITICAL REQUIREMENTS:
- You MUST analyze ALL analytes provided in the input data
- You MUST assign a status to EVERY SINGLE analyte (never skip any)
- For each analyte, determine status based on reference ranges:
  * If value < ref_low: status = "low"
  * If value > ref_high: status = "high" 
  * If ref_low <= value <= ref_high: status = "normal"
  * If no reference ranges provided: status = "unknown"
- The number of analytes in your response MUST equal the number in the input
- Always emphasize this is for educational purposes only
- Never diagnose conditions or recommend treatments
- Be conservative and non-alarmist
- Always include disclaimers about consulting healthcare professionals

VALIDATION CHECK: Before responding, count the input analytes and ensure your response contains the exact same number.

Return a JSON response with this exact structure:
{
  "overall_summary": "Brief educational summary of the lab panel",
  "overall_score": 75,
  "flags": ["Any notable observations"],
  "analytes": [
    {
      "name": "LDL",
      "value": 130,
      "unit": "mg/dL",
      "ref_low": 0,
      "ref_high": 129,
      "status": "high",
      "note": "Educational information about this value"
    }
  ],
  "chart_series": [
    {
      "key": "LDL",
      "points": [{"t": "2025-01-01", "v": 130}]
    }
  ],
  "disclaimers": ["This is for educational purposes only", "Consult your healthcare provider"]
}`;

export async function POST(request: NextRequest) {
  let body: any;
  let rawBody: string = '';
  
  try {
    // First, try to get the raw body text for debugging
    try {
      const requestClone = request.clone();
      rawBody = await requestClone.text();
      console.log('Raw request body (first 500 chars):', rawBody.substring(0, 500));
      console.log('Raw body length:', rawBody.length);
      console.log('Content-Type header:', request.headers.get('content-type'));
    } catch (rawError) {
      console.error('Failed to read raw request body:', rawError);
    }

    // Now try to parse as JSON
    try {
      body = await request.json();
    } catch (jsonParseError) {
      console.error('JSON parsing failed:', jsonParseError);
      console.error('Raw body that failed to parse:', rawBody);
      throw jsonParseError; // Re-throw to be handled by the outer catch
    }
    
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    // Try to validate with both schemas
    let validatedData: { 
      demographics?: { sex: string; birth_year: number; height_cm: number; weight_kg: number }; 
      lab_results?: Array<{ analyte: string; value: number; unit: string; ref_low?: number; ref_high?: number }>; 
      analytes?: Array<{ analyte: string; value: number; unit: string; ref_low?: number; ref_high?: number }> 
    };
    let isAnalytesOnly = false;
    
    try {
      console.log('Trying uploadRequestSchema validation...');
      validatedData = uploadRequestSchema.parse(body);
      console.log('uploadRequestSchema validation successful');
    } catch (uploadError) {
      console.log('uploadRequestSchema validation failed, trying analytesOnlySchema...', uploadError);
      try {
        // Try the analytes-only schema
        validatedData = analytesOnlySchema.parse(body);
        isAnalytesOnly = true;
        console.log('analytesOnlySchema validation successful');
      } catch (analytesError) {
        console.error('Both validation schemas failed:', { uploadError, analytesError });
        throw analytesError; // Throw the analytes error since that's what we expect
      }
    }
    
    // Handle data structure differences
    const demographics = isAnalytesOnly ? validatedData.demographics : validatedData.demographics;
    const labResults = isAnalytesOnly ? validatedData.analytes : validatedData.lab_results;
    
    // Create upload record (use default demographics if not provided)
    const defaultDemographics: Demographics = {
      sex: 'X',
      birth_year: new Date().getFullYear() - 30,
      height_cm: 170,
      weight_kg: 70,
    };
    
    const finalDemographics = (demographics || defaultDemographics) as Demographics;
    const upload = uploadRepo.create(finalDemographics, labResults || []);
    
    // Prepare data for OpenAI
    const promptData = {
      demographics: finalDemographics,
      lab_results: labResults,
      date: new Date().toISOString().split('T')[0],
      note: demographics ? undefined : "Demographics not provided - analysis based on lab values only",
    };
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze these lab results: ${JSON.stringify(promptData)}` },
      ],
    });
    
    const resultText = completion.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error('No response from OpenAI');
    }
    
    console.log('Raw OpenAI response:', resultText);
    
    // Parse JSON response - handle potential markdown formatting
    let result: any;
    try {
      // First, try to extract JSON from markdown code blocks if present
      let jsonText = resultText.trim();
      
      // Remove markdown code block formatting if present
      if (jsonText.startsWith('```json')) {
        const startIndex = jsonText.indexOf('{');
        const endIndex = jsonText.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          jsonText = jsonText.substring(startIndex, endIndex + 1);
        }
      } else if (jsonText.startsWith('```')) {
        // Handle generic code blocks
        const lines = jsonText.split('\n');
        lines.shift(); // Remove first ```
        if (lines[lines.length - 1].trim() === '```') {
          lines.pop(); // Remove last ```
        }
        jsonText = lines.join('\n').trim();
      }
      
      console.log('Cleaned JSON text:', jsonText);
      result = JSON.parse(jsonText);
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response text:', resultText);
      throw new Error(`Invalid JSON response from AI service: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    // POST-PROCESSING: Ensure all analytes have proper status assignments
    if (result.analytes && Array.isArray(result.analytes)) {
      console.log(`Post-processing ${result.analytes.length} analytes from OpenAI response`);
      console.log(`Original lab results count: ${labResults?.length || 0}`);
      
      // Function to calculate status based on reference ranges
      const calculateStatus = (value: number, refLow?: number, refHigh?: number): string => {
        if (typeof value !== 'number' || isNaN(value)) return 'unknown';
        
        if (refLow !== null && refLow !== undefined && value < refLow) return 'low';
        if (refHigh !== null && refHigh !== undefined && value > refHigh) return 'high';
        if ((refLow !== null && refLow !== undefined) || (refHigh !== null && refHigh !== undefined)) return 'normal';
        
        return 'unknown';
      };

      // Ensure all analytes have proper status
      result.analytes = result.analytes.map((analyte: any) => {
        if (!analyte.status || !['low', 'normal', 'high', 'unknown'].includes(analyte.status)) {
          const calculatedStatus = calculateStatus(analyte.value, analyte.ref_low, analyte.ref_high);
          console.log(`Fixed status for ${analyte.name}: ${analyte.status} -> ${calculatedStatus}`);
          analyte.status = calculatedStatus;
        }
        return analyte;
      });

      // Verify we have all analytes from the original input
      if (labResults && result.analytes.length !== labResults.length) {
        console.warn(`Analyte count mismatch: Input=${labResults.length}, Output=${result.analytes.length}`);
        
        // If OpenAI missed some analytes, add them with calculated status
        const processedNames = new Set(result.analytes.map((a: any) => a.name?.toLowerCase()));
        const missingAnalytes = labResults.filter((lab: any) => 
          !processedNames.has(lab.analyte?.toLowerCase())
        );

        for (const missing of missingAnalytes) {
          const status = calculateStatus(missing.value, missing.ref_low, missing.ref_high);
          result.analytes.push({
            name: missing.analyte,
            value: missing.value,
            unit: missing.unit || null,
            ref_low: missing.ref_low || null,
            ref_high: missing.ref_high || null,
            status: status,
            note: "Educational information - consult your healthcare provider for interpretation"
          });
          console.log(`Added missing analyte: ${missing.analyte} with status: ${status}`);
        }
      }

      console.log(`Final analyte count: ${result.analytes.length}`);
      const statusCounts = result.analytes.reduce((acc: any, a: any) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Status distribution:', statusCounts);
    }
    
    // Create report
    const report = reportRepo.create(upload.id, result);
    
    return NextResponse.json({ 
      success: true, 
      upload_id: upload.id,
      report_id: report.id 
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      console.error('Validation error details:', error);
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: error instanceof Error ? error.message : 'Validation failed',
          received_data: body // Include the received data for debugging
        },
        { status: 400 }
      );
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error details:', {
        message: error.message,
        rawBodyLength: rawBody.length,
        rawBodyPreview: rawBody.substring(0, 200),
        contentType: request.headers.get('content-type')
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid JSON format in request',
          details: 'The request body could not be parsed as valid JSON',
          debug: process.env.NODE_ENV === 'development' ? {
            syntaxError: error.message,
            bodyPreview: rawBody.substring(0, 100)
          } : undefined
        },
        { status: 400 }
      );
    }
    
    // Handle OpenAI API errors
    if (error && typeof error === 'object' && 'status' in error) {
      return NextResponse.json(
        { error: 'AI analysis service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}

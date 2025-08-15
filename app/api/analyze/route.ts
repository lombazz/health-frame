import { NextRequest, NextResponse } from 'next/server';
import { uploadRequestSchema } from '@/lib/validation';
import { openai, MODEL } from '@/lib/openai';
import { uploadRepo, reportRepo } from '@/lib/repo';

const SYSTEM_PROMPT = `You are a health data analysis assistant. You provide educational information about lab results but DO NOT provide medical advice or diagnoses.

IMPORTANT GUIDELINES:
- Always emphasize this is for educational purposes only
- Never diagnose conditions or recommend treatments
- Use provided reference ranges when available
- If no reference ranges provided, mark status as "unknown"
- Be conservative and non-alarmist
- Always include disclaimers about consulting healthcare professionals

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
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = uploadRequestSchema.parse(body);
    
    // Create upload record
    const upload = uploadRepo.create(validatedData.demographics, validatedData.lab_results);
    
    // Prepare data for OpenAI
    const promptData = {
      demographics: validatedData.demographics,
      lab_results: validatedData.lab_results,
      date: new Date().toISOString().split('T')[0],
    };
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze these lab results: ${JSON.stringify(promptData)}` },
      ],
    });
    
    const resultText = completion.choices[0]?.message?.content;
    if (!resultText) {
      throw new Error('No response from OpenAI');
    }
    
    // Parse JSON response
    const result = JSON.parse(resultText);
    
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
      return NextResponse.json(
        { error: 'Invalid input data', details: (error as any).errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}

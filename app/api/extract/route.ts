import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function j(err: any, status = 500) {
  console.error("[/api/extract]", err);
  const msg =
    typeof err === "string"
      ? err
      : err?.message || err?.toString?.() || "unknown_error";
  const stack = err?.stack || null;
  return NextResponse.json({ error: msg, stack }, { status });
}

function parseNumericValue(value: any): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return NaN;
  
  let str = String(value).trim();
  
  // Remove common symbols and arrows
  str = str.replace(/[↑↓→←⬆⬇]/g, '');
  
  // Remove units (common patterns)
  str = str.replace(/\s*(mg\/dL|g\/dL|mmol\/L|µmol\/L|U\/L|%|g\/L|mg\/L)\s*$/i, '');
  
  // Clean up whitespace
  str = str.trim();
  
  // Handle European decimal separator (comma) vs thousand separator
  // Check if there's a comma followed by 1-2 digits at the end (decimal separator)
  if (/^\d+,\d{1,2}$/.test(str)) {
    // Single comma with 1-2 digits after: decimal separator
    str = str.replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})*$/.test(str)) {
    // Comma every 3 digits: thousand separator
    str = str.replace(/,/g, '');
  } else if (/^\d{1,3}(,\d{3})*\.\d+$/.test(str)) {
    // Mixed: commas as thousand separators, dot as decimal
    const parts = str.split('.');
    str = parts[0].replace(/,/g, '') + '.' + parts[1];
  } else {
    // Other cases: remove all commas and hope for the best
    str = str.replace(/,/g, '');
  }
  
  const result = parseFloat(str);
  return isNaN(result) ? NaN : result;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return j("no_file", 400);
    if (file.type !== "application/pdf") return j("not_pdf", 415);
    if (file.size > 10 * 1024 * 1024) return j("file_too_large_>10MB", 413);

    // ---- PDF -> text via pdf-parse (first attempt)
    const buf = Buffer.from(await file.arrayBuffer());
    const pdfParseMod: any = await import("pdf-parse");
    const pdfParse = pdfParseMod.default || pdfParseMod; // handle CJS/ESM
    let parsed = await pdfParse(buf);
    let text: string = (parsed?.text || "").trim();

    // If text looks too short or noisy, try pdfjs-dist text extraction (second attempt)
    if (!text || text.length < 200) {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        const loadingTask = pdfjsLib.getDocument({ data: buf });
        const pdf = await loadingTask.promise;
        let pagesText: string[] = [];
        const maxPages = Math.min(pdf.numPages, 5);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((it: any) => (it.str || '')).join(' ');
          pagesText.push(pageText);
        }
        text = pagesText.join('\n').trim();
        console.log(`[/api/extract] pdfjs text length=${text.length}`);
      } catch (e) {
        console.warn('[/api/extract] pdfjs text extraction failed:', e);
      }
    }

    if (!text || text.length < 50) {
      return j("pdf_text_empty_or_too_short", 422);
    }

    // ---- OpenAI call (text-only extraction)
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    const schema = {
      name: "LabExtractV1",
      schema: {
        type: "object",
        properties: {
          document_meta: {
            type: "object",
            properties: {
              lab_name: { type: ["string", "null"] },
              collection_date: { type: ["string", "null"] }
            },
            required: ["lab_name", "collection_date"],
            additionalProperties: false
          },
          analytes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "number" },
                unit: { type: ["string", "null"] },
                ref_low: { type: ["number", "null"] },
                ref_high: { type: ["number", "null"] }
              },
              required: ["name", "value"],
              additionalProperties: false
            }
          }
        },
        required: ["document_meta", "analytes"],
        additionalProperties: false
      },
      strict: true
    } as const;

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

    let outText: string | undefined;
    let data: any;

    // Log extracted text for debugging
    console.log(`[/api/extract] Extracted text length: ${text.length}`);
    console.log(`[/api/extract] Text preview (first 500 chars): ${text.slice(0, 500)}`);

    // Enhanced extraction with retry logic for consistency
    const maxRetries = 3;
    let bestResult: any = null;
    let bestAnalyteCount = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[/api/extract] Attempt ${attempt}/${maxRetries}: Sending text-only request to OpenAI (model: ${model})`);
      
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: text.slice(0, 50000) }
          ],
          response_format: { type: "json_object" },
          // Add temperature for deterministic results
          temperature: 0.1,
          // Add seed for more consistent results (if supported)
          seed: 12345
        });
        
        outText = response.choices?.[0]?.message?.content || undefined;
        console.log(`[/api/extract] Attempt ${attempt} response length: ${outText?.length || 0}`);

        if (outText) {
          try {
            const attemptData = JSON.parse(outText);
            const analyteCount = Array.isArray(attemptData?.analytes) ? attemptData.analytes.length : 0;
            
            console.log(`[/api/extract] Attempt ${attempt} found ${analyteCount} analytes`);
            
            // Keep the result with the most analytes
            if (analyteCount > bestAnalyteCount) {
              bestResult = attemptData;
              bestAnalyteCount = analyteCount;
              console.log(`[/api/extract] New best result: ${analyteCount} analytes`);
            }
            
            // If we found a comprehensive result (20+ analytes), use it
             if (analyteCount >= 20) {
               console.log(`[/api/extract] Found comprehensive result with ${analyteCount} analytes, stopping retries`);
               data = attemptData;
               data.extraction_method = 'text_only';
               break;
             }
            
          } catch (e) {
            console.warn(`[/api/extract] Attempt ${attempt} JSON parse failed:`, e);
          }
        }
        
        // Add small delay between retries to avoid rate limiting
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (apiErr: any) {
        console.error(`[/api/extract] Attempt ${attempt} API error: ${apiErr?.message || apiErr}`);
        if (attempt === maxRetries) {
          return j(`openai_api_error: ${apiErr?.message || apiErr}`, 502);
        }
      }
    }

    // Use the best result if no comprehensive result was found
     if (!data && bestResult) {
       console.log(`[/api/extract] Using best result with ${bestAnalyteCount} analytes`);
       data = bestResult;
       data.extraction_method = 'text_only';
     }

    // Log final extraction results
    if (data) {
      console.log(`[/api/extract] Final extraction result:`, {
        has_document_meta: !!data?.document_meta,
        has_analytes: !!data?.analytes,
        analytes_count: Array.isArray(data?.analytes) ? data.analytes.length : 0,
        analytes_preview: Array.isArray(data?.analytes) ? data.analytes.slice(0, 3).map((a: any) => a.name) : null
      });
    }

    // If analytes empty or missing, try vision fallback: render first pages to PNG and send images
    if (!data?.analytes || !Array.isArray(data.analytes) || data.analytes.length === 0) {
      console.log('[/api/extract] Attempting vision fallback due to empty analytes');
      try {
        const pdfjsLib: any = await import('pdfjs-dist');
        const { createCanvas } = await import('canvas');
        
        // Configure PDF.js for Node.js environment
        pdfjsLib.GlobalWorkerOptions.workerSrc = null;
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: buf,
          useSystemFonts: true,
          disableFontFace: true
        });
        const pdf = await loadingTask.promise;
        const maxPages = Math.min(pdf.numPages, 2);
        const images: string[] = [];
        
        console.log(`[/api/extract] Processing ${maxPages} pages for vision analysis`);
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
          const ctx = canvas.getContext('2d');
          
          // Create a render context compatible with Node.js canvas
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            enableWebGL: false
          };
          
          await page.render(renderContext).promise;
          const dataUrl = canvas.toDataURL('image/png');
          images.push(dataUrl);
          console.log(`[/api/extract] Rendered page ${i} to image (${dataUrl.length} chars)`);
        }

        if (images.length > 0) {
          const visionMessages = [
            { role: 'system', content: system },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract structured lab results JSON from these medical report images. Look for test names, numeric values, units, and reference ranges.' },
                ...images.map((url) => ({ type: 'image_url', image_url: { url } }))
              ]
            }
          ] as any;

          console.log('[/api/extract] Sending vision request to OpenAI');
          const visionResp = await client.chat.completions.create({
            model,
            messages: visionMessages,
            response_format: { type: 'json_object' },
            temperature: 0.1,
            seed: 12345
          });
          const visionText = visionResp.choices?.[0]?.message?.content || undefined;
          console.log('[/api/extract] Vision response length:', visionText?.length || 0);
          
          if (visionText) {
            try {
              const visionData = JSON.parse(visionText);
              const visionAnalyteCount = Array.isArray(visionData?.analytes) ? visionData.analytes.length : 0;
              console.log('[/api/extract] Vision extraction successful, analytes found:', visionAnalyteCount);
              
              // Use vision result if it's better than text result
               if (visionAnalyteCount > bestAnalyteCount) {
                 console.log('[/api/extract] Vision result is better, using it');
                 data = visionData;
                 data.extraction_method = 'vision_fallback';
               }
            } catch (e) {
              console.warn('[/api/extract] vision json_parse_failed:', e);
            }
          }
        }
      } catch (e) {
        console.warn('[/api/extract] vision fallback failed:', e);
        // Continue with text-only processing
      }
    }

    if (!data) return j("model_empty_response", 502);

    // Log raw analytes before processing
    console.log("[/api/extract] Raw analytes from LLM:", JSON.stringify(data.analytes, null, 2));

    // minimal normalization
    const map: Record<string, string> = {
      "ldl-c": "LDL",
      "hdl-c": "HDL", 
      "glycated hemoglobin": "HbA1c",
      "hba1c": "HbA1c",
      "glucose (fasting)": "Glucose",
      hb: "Hemoglobin"
    };

    const processedAnalytes = (data.analytes || [])
      .map((a: any) => {
        const processed = {
          name: map[a?.name?.toLowerCase?.()] || a?.name,
          value: parseNumericValue(a?.value),
          unit: a?.unit ?? null,
          ref_low: a?.ref_low == null ? null : parseNumericValue(a?.ref_low),
          ref_high: a?.ref_high == null ? null : parseNumericValue(a?.ref_high)
        };
        
        // Log parsing results for debugging
        if (a?.value !== undefined) {
          console.log(`[/api/extract] Parsing "${a?.value}" -> ${processed.value} (finite: ${Number.isFinite(processed.value)})`);
        }
        
        return processed;
      })
      .filter((a: any) => a.name && Number.isFinite(a.value));

    console.log("[/api/extract] Final processed analytes:", JSON.stringify(processedAnalytes, null, 2));
    
    // Validation and quality checks
    const finalAnalyteCount = processedAnalytes.length;
    console.log(`[/api/extract] EXTRACTION SUMMARY: Found ${finalAnalyteCount} valid analytes`);
    
    // Log warning if extraction seems incomplete
    if (finalAnalyteCount < 10) {
      console.warn(`[/api/extract] WARNING: Only ${finalAnalyteCount} analytes extracted. This may indicate incomplete extraction.`);
      console.warn(`[/api/extract] Text length: ${text.length}, Expected comprehensive lab report to have 20+ analytes`);
    } else if (finalAnalyteCount >= 20) {
      console.log(`[/api/extract] SUCCESS: Comprehensive extraction with ${finalAnalyteCount} analytes`);
    } else {
      console.log(`[/api/extract] PARTIAL: Moderate extraction with ${finalAnalyteCount} analytes`);
    }
    
    // Add extraction metadata for monitoring
    const extractionMeta = {
      extraction_quality: finalAnalyteCount >= 20 ? 'comprehensive' : finalAnalyteCount >= 10 ? 'moderate' : 'limited',
      analyte_count: finalAnalyteCount,
      text_length: text.length,
      extraction_method: data.extraction_method || 'text_only'
    };
    
    data.analytes = processedAnalytes;
    data.extraction_meta = extractionMeta;

    return NextResponse.json(data);
  } catch (err: any) {
    return j(err, 500);
  }
}
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

    // ---- PDF -> text
    const buf = Buffer.from(await file.arrayBuffer());
    const pdfParseMod: any = await import("pdf-parse");
    const pdfParse = pdfParseMod.default || pdfParseMod; // handle CJS/ESM
    const parsed = await pdfParse(buf);
    const text: string = (parsed?.text || "").trim();
    if (!text || text.length < 20) {
      return j("pdf_text_empty_or_too_short", 422);
    }

    // ---- OpenAI call (supports both new Responses API and old Chat API)
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

    const system = `You extract lab results from clinical lab reports.
Return ONLY valid JSON per schema.
Use ranges when present; else null. No guessing. No prose. 
CRITICAL: All numeric values must use dot (.) as decimal separator, never comma (,).
Examples: 17.9, 120.5, 0.85 - NOT 17,9 or 120,5.
Remove any units, arrows, or symbols from numeric values.`;

    let outText: string | undefined;

    // Use the standard OpenAI Chat Completions API
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text.slice(0, 50000) }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      });
      outText = response.choices?.[0]?.message?.content || undefined;
    } catch (apiErr: any) {
      return j(`openai_api_error: ${apiErr?.message || apiErr}`, 502);
    }

    if (!outText) return j("model_empty_response", 502);

    let data: any;
    try {
      data = JSON.parse(outText);
    } catch (e) {
      return j(`json_parse_failed: ${outText?.slice(0, 200)}`, 502);
    }

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
    data.analytes = processedAnalytes;

    return NextResponse.json(data);
  } catch (err: any) {
    return j(err, 500);
  }
}
const fs = require('fs');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXTRACTION_PROMPT = `You are extracting structured data from a DEXA (DXA) body composition scan report PDF.

Extract ONLY the values listed below. Return a single JSON object with exactly these keys.
If a value is not found in the document, use null.
Do not include any explanation or markdown — just the raw JSON object.

{
  "scan_date": "YYYY-MM-DD",           // Date of the scan
  "scan_id_raw": "string",             // Scan ID from the report (e.g. "A0622240C")
  "weight_lb": number,                 // Total body weight in pounds
  "height_in": number,                 // Height in inches
  "bmi": number,                       // BMI value

  // Body Composition (from Body Composition Results table)
  "total_body_fat_pct": number,        // Total body fat percentage
  "fat_mass_lb": number,               // Total fat mass in pounds
  "lean_mass_lb": number,              // Total lean mass in pounds (Lean + BMC column, Total row, minus BMC)
  "bmc_lb": number,                    // Bone mineral content in pounds
  "total_mass_lb": number,             // Total mass in pounds

  // Bone Density (from DXA Results Summary, Total row)
  "bmd_total": number,                 // Total BMD g/cm²
  "bmd_t_score": number,               // T-score
  "bmd_z_score": number,               // Z-score

  // Regional Fat (from Body Composition Results)
  "trunk_fat_pct": number,             // Trunk % fat
  "legs_fat_pct": number,              // Average of L Leg + R Leg % fat
  "android_fat_pct": number,           // Android % fat
  "gynoid_fat_pct": number,            // Gynoid % fat

  // Adipose Indices
  "android_gynoid_ratio": number,      // Android/Gynoid Ratio
  "vat_mass_g": number,                // Est. VAT Mass in grams
  "vat_volume_cm3": number,            // Est. VAT Volume in cm³
  "vat_area_cm2": number,              // Est. VAT Area in cm²

  // Lean Indices
  "lean_height2": number,              // Lean/Height² kg/m²
  "appen_lean_height2": number         // Appendicular Lean/Height² kg/m²
}`;

async function parseDexaPdf(filePath) {
    const pdfBuffer = fs.readFileSync(filePath);
    const base64 = pdfBuffer.toString('base64');

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: EXTRACTION_PROMPT,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:application/pdf;base64,${base64}`,
                            detail: 'high',
                        },
                    },
                ],
            },
        ],
    });

    const raw = response.choices[0].message.content.trim();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(`Could not parse AI response as JSON: ${cleaned.slice(0, 200)}`);
    }

    // Normalise date
    if (parsed.scan_date) {
        const d = new Date(parsed.scan_date);
        if (!isNaN(d)) parsed.scan_date = d.toISOString().split('T')[0];
    }

    return parsed;
}

module.exports = { parseDexaPdf };

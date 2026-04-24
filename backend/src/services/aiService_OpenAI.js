const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are MemberGPT, an AI assistant for Kalos Health coaches.
You have access to DEXA body composition scan data for all members.
Answer questions clearly and concisely, grounding every claim in the actual data provided.

Rules:
- If you cannot answer from the data, say so explicitly — do not guess or hallucinate numbers.
- When citing metrics, include the scan date for context.
- Body fat % changes: losing fat = improvement; gaining lean mass = improvement.
- Flag concerning trends (e.g. losing lean mass) proactively if relevant.
- Keep responses concise but complete. Use bullet points for comparisons and lists.`;

function formatScanContext(scans, members) {
    const memberMap = {};

    for (const scan of scans) {
        const name = scan.member_name;
        if (!memberMap[name]) memberMap[name] = [];
        memberMap[name].push({
            date: scan.scan_date?.toISOString?.().split('T')[0] ?? scan.scan_date,
            weight_lb: scan.weight_lb,
            body_fat_pct: scan.total_body_fat_pct,
            fat_mass_lb: scan.fat_mass_lb,
            lean_mass_lb: scan.lean_mass_lb,
            bmd_t_score: scan.bmd_t_score,
            vat_mass_g: scan.vat_mass_g,
            android_gynoid_ratio: scan.android_gynoid_ratio,
            trunk_fat_pct: scan.trunk_fat_pct,
            legs_fat_pct: scan.legs_fat_pct,
            lean_height2: scan.lean_height2,
        });
    }

    const memberSummaries = members.map(m =>
        `${m.name}: ${m.scan_count} scan(s)`
    ).join('\n');

    return `## Members (${members.length} total)\n${memberSummaries}\n\n## Scan Data\n${JSON.stringify(memberMap, null, 2)}`;
}

async function chatQuery({ message, history, scans, members }) {
    const context = formatScanContext(scans, members);

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
            role: 'system',
            content: `Current member and scan data:\n\n${context}`,
        },
        // Inject conversation history (coach multi-turn)
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1000,
        temperature: 0.3, // Lower temp = more factual
        messages,
    });

    return response.choices[0].message.content;
}

module.exports = { chatQuery };

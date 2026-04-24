const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.MEMBER_GPT_API_URL,
    'X-Title': 'Kalos MemberGPT',
  },
});

const SYSTEM_PROMPT = `
You are MemberGPT, an AI assistant for Kalos Health coaches.

RULES:
1. ONLY use data provided in the context below. Never guess or infer missing values.
2. If data is insufficient, say exactly: "I don't have enough data to answer that."
3. Always reference scan dates when citing numbers.
4. Highlight trends: decreasing body fat = improvement; increasing lean mass = improvement; losing lean mass = concern.
5. Use bullet points for comparisons. Be concise.
`.trim();

function formatScanContext(scans, members) {
  const memberMap = {};

  for (const scan of scans) {
    const name = scan.member_name;
    if (!memberMap[name]) memberMap[name] = [];
    memberMap[name].push({
      date:                 scan.scan_date?.toISOString?.().split('T')[0] ?? scan.scan_date,
      weight_lb:            scan.weight_lb,
      body_fat_pct:         scan.total_body_fat_pct,
      fat_mass_lb:          scan.fat_mass_lb,
      lean_mass_lb:         scan.lean_mass_lb,
      vat_mass_g:           scan.vat_mass_g,
      bmd_t_score:          scan.bmd_t_score,
      android_gynoid_ratio: scan.android_gynoid_ratio,
      trunk_fat_pct:        scan.trunk_fat_pct,
      lean_height2:         scan.lean_height2,
    });
  }

  // Sort chronologically
  for (const name in memberMap) {
    memberMap[name].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const summaries = Object.entries(memberMap).map(([name, memberScans]) => {
    const first = memberScans[0];
    const last  = memberScans[memberScans.length - 1];
    const hasMultiple = memberScans.length > 1;

    return {
      name,
      total_scans: memberScans.length,
      trend: {
        body_fat_change:  hasMultiple ? +(last.body_fat_pct - first.body_fat_pct).toFixed(2) : 'only one scan',
        lean_mass_change: hasMultiple ? +(last.lean_mass_lb - first.lean_mass_lb).toFixed(2)  : 'only one scan',
      },
      scans: memberScans,
    };
  });

  return JSON.stringify({ total_members: members.length, members: summaries }, null, 2);
}

async function chatQuery({ message, history = [], scans = [], members = [] }) {
  const context = formatScanContext(scans, members);

  // Keep last 10 messages (5 user/assistant pairs)
  const trimmedHistory = history.slice(-10);

  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n---\nCURRENT DATA:\n${context}`,
    },
    ...trimmedHistory.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await openai.chat.completions.create({
      model:       'anthropic/claude-3-haiku',
      max_tokens:  800,
      temperature: 0.3,
      messages,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('[aiService] chatQuery failed:', err?.response?.data || err.message);
    const error = new Error('AI service unavailable');
    error.status = 502;
    throw error;
  }
}

module.exports = { chatQuery };
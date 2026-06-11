export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let csvContent;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    csvContent = body?.csvContent;
  } catch(e) {
    return res.status(400).json({ error: 'Body parse error: ' + e.message });
  }

  if (!csvContent) return res.status(400).json({ error: 'CSV content required' });

  const prompt = `당신은 커머스 서비스의 VOC 분석 전문가입니다. 아래 VOC 데이터를 분석해서 반드시 JSON만 반환하세요. 절대로 다른 텍스트, 설명, 마크다운 코드블록 없이 순수 JSON 객체만 반환하세요. 첫 글자는 반드시 { 이어야 합니다.

VOC 데이터:
${csvContent.slice(0, 3000)}

반환할 JSON 형식 (이 형식 그대로, 값만 채워서 반환):
{"total":0,"negative_ratio":0,"positive_ratio":0,"complaints":[{"rank":1,"topic":"주제","pct":0,"example":"사례"},{"rank":2,"topic":"주제","pct":0,"example":"사례"},{"rank":3,"topic":"주제","pct":0,"example":"사례"},{"rank":4,"topic":"주제","pct":0,"example":"사례"},{"rank":5,"topic":"주제","pct":0,"example":"사례"}],"positives":[{"rank":1,"topic":"주제","pct":0,"example":"사례"},{"rank":2,"topic":"주제","pct":0,"example":"사례"},{"rank":3,"topic":"주제","pct":0,"example":"사례"},{"rank":4,"topic":"주제","pct":0,"example":"사례"},{"rank":5,"topic":"주제","pct":0,"example":"사례"}],"urgent":[{"issue":"이슈제목","reason":"이유","severity":"high"},{"issue":"이슈제목","reason":"이유","severity":"medium"}],"suggestions":[{"title":"제안제목","detail":"상세내용"},{"title":"제안제목","detail":"상세내용"},{"title":"제안제목","detail":"상세내용"}],"summary":"종합요약 3-4문장"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'JSON 파싱 실패: ' + clean.slice(0, 200) });

    const result = JSON.parse(jsonMatch[0]);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

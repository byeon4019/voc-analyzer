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

  const prompt = `VOC 분석 전문가. 아래 데이터를 분석해 순수 JSON만 반환. 텍스트/마크다운 절대 금지. 첫 글자 반드시 {

데이터:
${csvContent.slice(0, 4000)}

형식:
{"total":0,"negative_ratio":0,"positive_ratio":0,"complaints":[{"rank":1,"topic":"","pct":0,"example":""},{"rank":2,"topic":"","pct":0,"example":""},{"rank":3,"topic":"","pct":0,"example":""},{"rank":4,"topic":"","pct":0,"example":""},{"rank":5,"topic":"","pct":0,"example":""}],"positives":[{"rank":1,"topic":"","pct":0,"example":""},{"rank":2,"topic":"","pct":0,"example":""},{"rank":3,"topic":"","pct":0,"example":""},{"rank":4,"topic":"","pct":0,"example":""},{"rank":5,"topic":"","pct":0,"example":""}],"urgent":[{"issue":"","reason":"","severity":"high"},{"issue":"","reason":"","severity":"medium"}],"suggestions":[{"title":"","detail":""},{"title":"","detail":""},{"title":"","detail":""}],"summary":""}`;

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
        max_tokens: 3000,
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

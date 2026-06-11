export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { csvContent } = req.body;
  if (!csvContent) return res.status(400).json({ error: 'CSV content required' });

  const prompt = `당신은 커머스 서비스의 VOC 분석 전문가입니다. 아래 VOC 데이터를 분석해서 반드시 JSON만 반환하세요. 다른 텍스트나 마크다운 없이 순수 JSON만.

VOC 데이터:
${csvContent.slice(0, 4000)}

다음 JSON 형식으로 분석 결과를 반환하세요:
{
  "total": 전체 VOC 수(숫자),
  "negative_ratio": 부정 비율(0-100 숫자),
  "positive_ratio": 긍정 비율(0-100 숫자),
  "complaints": [
    {"rank": 1, "topic": "불만 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 2, "topic": "불만 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 3, "topic": "불만 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 4, "topic": "불만 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 5, "topic": "불만 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"}
  ],
  "positives": [
    {"rank": 1, "topic": "긍정 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 2, "topic": "긍정 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 3, "topic": "긍정 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 4, "topic": "긍정 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"},
    {"rank": 5, "topic": "긍정 주제", "pct": 비율숫자, "example": "대표 사례 한 문장"}
  ],
  "urgent": [
    {"issue": "긴급 이슈 제목", "reason": "긴급한 이유", "severity": "high 또는 medium"},
    {"issue": "긴급 이슈 제목", "reason": "긴급한 이유", "severity": "high 또는 medium"}
  ],
  "suggestions": [
    {"title": "개선 제안 제목", "detail": "구체적인 개선 방향"},
    {"title": "개선 제안 제목", "detail": "구체적인 개선 방향"},
    {"title": "개선 제안 제목", "detail": "구체적인 개선 방향"}
  ],
  "summary": "전체 VOC 분석 종합 요약 (3-4문장, 핵심 문제와 우선순위 액션 포함)"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

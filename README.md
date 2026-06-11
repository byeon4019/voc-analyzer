# AI VOC 인사이트 분석기

고객 VOC CSV 파일을 업로드하면 Claude API가 자동으로 인사이트를 추출하는 도구입니다.

## 기능
- 고객 불만 TOP 5 추출 및 시각화
- 긍정 의견 TOP 5 추출
- 긴급 이슈 감지
- 기능 개선 제안
- 종합 요약

## 배포 (Vercel)

1. GitHub에 이 레포지토리를 올립니다
2. [vercel.com](https://vercel.com)에서 GitHub 연동 후 import
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy

## CSV 형식

```
id,date,channel,content
1,2025-06-01,앱리뷰,배송이 너무 늦어요
```

`content` 컬럼이 있으면 다른 컬럼명은 자유롭게 사용 가능합니다.

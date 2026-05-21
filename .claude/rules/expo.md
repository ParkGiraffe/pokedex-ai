---
description: Expo 개발 규칙을 설명한다.
paths:
  - "apps/mobile/**"
---

# 주의사항

- 네이티브 설정은 `app.json` 또는 Expo Config Plugin으로만 처리한다.
- Expo 공식 패키지가 있으면 커뮤니티 패키지보다 반드시 우선한다.
- Expo SDK와 네이티브 모듈의 버전이 어긋나면 ABI가 깨지므로, 호환되는 버전만 사용한다.
- `expo prebuild` 결과물은 절대로 수정하지 않는다.

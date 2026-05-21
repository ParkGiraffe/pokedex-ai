# pokedex-agent

박기린의 개인 포켓몬 SV 싱글배틀 도구. 스마트누오(smartnuo.com) 기능을 모두 포함한 웹앱에 Claude Code 대화형 AI 분석을 결합했다.

## 무엇을 하는가

| 기능                              | 어디서      |
|--------------------------------|----------|
| 데미지 계산기 (테라·스텔라 포함)         | 웹앱       |
| 스피드 비교                         | 웹앱       |
| 도감 (1025마리 한국어 공식 표기)       | 웹앱       |
| 파티 빌더 (6마리, 9세대 SV)            | 웹앱       |
| 파티 장단점 분석                    | Claude Code 대화 |
| 매치업 선두 추천                    | Claude Code 대화 |
| 실시간 배틀 의사결정 (기술 vs 교체) | Claude Code 대화 |

웹앱과 Claude 사이는 **클립보드 양방향 paste**로 연결된다. 자동 IPC 없음.

## 시작

본격 개발은 Claude Code 안에서 진행한다. `claude` 실행 후 `CLAUDE.md` 자동 로드.

```bash
cd /Users/bag-yoseb/Desktop/Project/personal/pokedex-agent
claude
```

## 컨벤션

`/Users/bag-yoseb/Desktop/Project/github/p2z` 의 CLAUDE.md와 코드 스타일을 판박이로 따른다.

## 상세 설계

`docs/specs/` 아래 Phase별 디자인 문서.

import { describe, expect, it } from "vitest";

import { parseClaudeResponse } from "../src/parse";

describe("Claude 응답 파싱", () => {
  it("표준 JSON 블록을 추출한다", () => {
    const response = `
파티 분석 결과는 다음과 같다.
- 내구형 중심 구조라 시간 끌기에 강하지만 화력이 부족하다.

\`\`\`json
{
  "task": "party-analysis",
  "summary": "내구형 6풀로 컨디션 좋음",
  "details": [
    { "kind": "weakness", "target": "1번 어써러셔", "text": "전기 4배 카운터가 무섭다", "evidence": {} }
  ],
  "actionable": []
}
\`\`\`
    `;
    const parsed = parseClaudeResponse(response);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.task).toBe("party-analysis");
      expect(parsed.data.details).toHaveLength(1);
    }
  });

  it("JSON이 없으면 실패한다", () => {
    const parsed = parseClaudeResponse("그냥 텍스트만 있음");
    expect(parsed.success).toBe(false);
  });

  it("스키마에 맞지 않으면 실패한다", () => {
    const parsed = parseClaudeResponse('```json\n{"task":"unknown-task"}\n```');
    expect(parsed.success).toBe(false);
  });
});

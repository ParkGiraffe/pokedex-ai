import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useClaudeBridgeStore } from "../model/store";
import { PasteSidePanel } from "./PasteSidePanel";

const VALID_RESPONSE = `분석 결과는 다음과 같다.
\`\`\`json
{"task":"party-analysis","summary":"내구형 6풀로 컨디션 좋음","details":[{"kind":"weakness","target":"1번 어써러셔","text":"전기 4배 카운터가 무섭다","evidence":{}}],"actionable":[]}
\`\`\``;

describe("PasteSidePanel", () => {
  beforeEach(() => {
    useClaudeBridgeStore.setState({ lastResult: null });
  });

  it("표준 JSON 응답을 반영하면 요약과 약점이 표시된다", () => {
    render(<PasteSidePanel open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/붙여넣기/), {
      target: { value: VALID_RESPONSE },
    });
    fireEvent.click(screen.getByRole("button", { name: "분석 결과 반영" }));
    expect(screen.getByText("내구형 6풀로 컨디션 좋음")).toBeInTheDocument();
    expect(screen.getByText("전기 4배 카운터가 무섭다")).toBeInTheDocument();
  });

  it("형식이 어긋난 응답은 반영하지 않는다", () => {
    render(<PasteSidePanel open onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/붙여넣기/), {
      target: { value: "그냥 텍스트" },
    });
    fireEvent.click(screen.getByRole("button", { name: "분석 결과 반영" }));
    expect(useClaudeBridgeStore.getState().lastResult).toBeNull();
  });
});

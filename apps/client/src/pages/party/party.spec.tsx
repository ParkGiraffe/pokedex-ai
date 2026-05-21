import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildParty, memberError, teamWeakness } from "./lib/party";
import { createDraft, type MemberDraft } from "./model/store";
import { PartyPage } from "./ui/PartyPage";

const validDraft: MemberDraft = {
  species: "한카리아스",
  level: 50,
  ability: "까칠한피부",
  item: "",
  nature: "고집",
  teraType: "땅",
  moves: ["지진", "역린", "스톤에지", "불꽃엄니"],
  evs: { H: 0, A: 252, B: 0, C: 0, D: 4, S: 252 },
};

describe("파티빌더 페이지", () => {
  it("기본 슬롯을 렌더한다", () => {
    render(<PartyPage />);
    expect(screen.getByRole("heading", { name: "파티빌더" })).toBeInTheDocument();
    expect(screen.getByText("슬롯 1")).toBeInTheDocument();
  });

  it("유효한 멤버만 파티로 모은다", () => {
    expect(buildParty([validDraft])).toHaveLength(1);
    expect(buildParty([createDraft()])).toHaveLength(0);
    expect(memberError(createDraft())).not.toBeNull();
    expect(memberError(validDraft)).toBeNull();
  });

  it("한카리아스가 들어간 파티는 얼음에 약하다", () => {
    const ice = teamWeakness([validDraft]).find((entry) => entry.type === "얼음");
    expect(ice?.weakCount).toBe(1);
  });
});

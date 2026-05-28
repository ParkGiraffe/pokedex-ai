import { describe, expect, it } from "vitest";

import { effectiveSpeed, fasterSide } from "../src/formula/speed";

describe("스피드 공식", () => {
  it("기본 스피드를 그대로 돌려준다", () => {
    expect(effectiveSpeed({ base: 100 })).toBe(100);
  });

  it("랭크 +1은 1.5배 적용", () => {
    expect(effectiveSpeed({ base: 100, rank: 1 })).toBe(150);
  });

  it("랭크 -2는 2/4 = 0.5배 적용", () => {
    expect(effectiveSpeed({ base: 100, rank: -2 })).toBe(50);
  });

  it("순풍은 마지막에 2배", () => {
    expect(effectiveSpeed({ base: 100, rank: 1, tailwind: true })).toBe(300);
  });

  it("마비는 절반", () => {
    expect(effectiveSpeed({ base: 100, paralyzed: true })).toBe(50);
  });

  it("끈적끈적네트는 1/3로 깎임", () => {
    expect(effectiveSpeed({ base: 99, stickyWeb: true })).toBe(33);
  });

  it("트릭룸 상태에선 느린 쪽이 먼저 행동한다", () => {
    expect(fasterSide({ left: 100, right: 200 }, { trickRoom: false })).toBe("right");
    expect(fasterSide({ left: 100, right: 200 }, { trickRoom: true })).toBe("left");
  });

  it("동률이면 50%로 표시한다", () => {
    expect(fasterSide({ left: 150, right: 150 }, { trickRoom: false })).toBe("tie");
  });
});

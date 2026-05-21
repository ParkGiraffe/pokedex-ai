import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("라벨을 버튼으로 렌더한다", () => {
    render(<Button>분석</Button>);
    expect(screen.getByRole("button", { name: "분석" })).toBeInTheDocument();
  });

  it("type 기본값은 button이다", () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" })).toHaveAttribute("type", "button");
  });
});

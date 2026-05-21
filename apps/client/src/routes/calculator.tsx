import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "./__root";

const CalculatorPage = () => (
  <section>
    <h1 className="text-xl font-bold">계산기</h1>
    <p className="mt-2 text-sm text-neutral-400">데미지 계산 (준비 중)</p>
  </section>
);

export const calculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: CalculatorPage,
});

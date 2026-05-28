import { createRoute } from "@tanstack/react-router";

import { CalculatorPage } from "@/pages/calculator/ui/CalculatorPage";

import { rootRoute } from "./__root";

export const calculatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: CalculatorPage,
});

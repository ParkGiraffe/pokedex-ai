import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";

import { AuthMenu } from "@/features/auth";
import { isLightTheme, ThemeSwitcher, useThemeStore } from "@/features/theme";

const NAV = [
  { to: "/", labelKey: "calculator" },
  { to: "/speed", labelKey: "speed" },
  { to: "/docs", labelKey: "dex" },
  { to: "/party", labelKey: "partyBuilder" },
  { to: "/matchup", labelKey: "matchup" },
  { to: "/battle", labelKey: "battle" },
] as const;

const RootLayout = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-sm font-semibold tracking-tight text-primary">
            {t("appName")}
          </span>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AuthMenu />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <Toaster position="top-center" richColors theme={isLightTheme(theme) ? "light" : "dark"} />
    </div>
  );
};

export const rootRoute = createRootRoute({ component: RootLayout });

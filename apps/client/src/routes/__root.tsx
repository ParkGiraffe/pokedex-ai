import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";

const NAV = [
  { to: "/", labelKey: "calculator" },
  { to: "/speed", labelKey: "speed" },
  { to: "/docs", labelKey: "dex" },
  { to: "/party", labelKey: "partyBuilder" },
  { to: "/matchup", labelKey: "matchup" },
] as const;

const RootLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-sm font-semibold tracking-tight text-emerald-400">
            {t("appName")}
          </span>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
                activeProps={{ className: "bg-neutral-800 text-neutral-100" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
};

export const rootRoute = createRootRoute({ component: RootLayout });

import { Link, Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function AppLayout() {
  const location = useLocation();
  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded text-sm font-semibold uppercase tracking-wide transition-colors ${
        location.pathname === to
          ? "bg-ignium-accent text-ignium-onAccent"
          : "text-ignium-muted hover:text-ignium-text hover:bg-ignium-overlay/5"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-ignium-bg">
      <header className="bg-ignium-panel border-b border-ignium-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="w-7 h-7 mr-2" />
          <span className="font-display font-bold text-ignium-text mr-4 tracking-wide">
            ENDURO PLANNER
          </span>
          {navItem("/", "Races")}
          {navItem("/drivers", "Drivers")}
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

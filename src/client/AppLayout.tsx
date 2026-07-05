import { Link, Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded text-sm font-medium ${
        location.pathname === to ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="font-bold text-slate-900 mr-4">Enduro Planner</span>
          {navItem("/", "Races")}
          {navItem("/drivers", "Drivers")}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

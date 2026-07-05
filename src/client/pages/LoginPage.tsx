import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { ThemeToggle } from "../ThemeToggle";

export function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(passcode);
      navigate("/");
    } catch {
      setError("Incorrect passcode");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ignium-bg">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-ignium-panel border border-ignium-border p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <img src="/favicon.svg" alt="" className="w-12 h-12 mb-4 mx-auto" />
        <h1 className="font-display text-xl font-bold mb-1 text-ignium-text text-center tracking-wide">
          ENDURO PLANNER
        </h1>
        <p className="text-sm text-ignium-muted mb-6 text-center">Ignium Motorsport — team access only</p>
        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full bg-ignium-panel2 border border-ignium-border rounded px-3 py-2 mb-3 text-ignium-text placeholder:text-ignium-muted focus:outline-none focus:border-ignium-accent"
          placeholder="Passcode"
        />
        {error && <p className="text-ignium-danger text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ignium-accent text-ignium-onAccent rounded py-2 font-semibold uppercase tracking-wide disabled:opacity-50 hover:brightness-110 transition"
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}

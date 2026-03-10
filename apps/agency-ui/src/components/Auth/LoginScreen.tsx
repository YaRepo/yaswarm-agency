import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { Zap } from "lucide-react";

export default function LoginScreen() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Token is required");
      return;
    }
    setLoading(true);
    setError("");
    const ok = await login(token.trim());
    if (!ok) {
      setError("Invalid token");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-yaswarm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yaswarm-accent/10 border border-yaswarm-accent/20 mb-4">
            <Zap className="w-8 h-8 text-yaswarm-accent" />
          </div>
          <h1 className="text-2xl font-bold text-yaswarm-text">YaSwarm Agency</h1>
          <p className="text-yaswarm-muted text-sm mt-1">Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="yaswarm-card space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-yaswarm-muted mb-1.5">
              Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your access token"
              className="yaswarm-input w-full"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-yaswarm-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="yaswarm-btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

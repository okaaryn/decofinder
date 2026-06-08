"use client";

import { useState } from "react";
import ExportForm from "@/components/ExportForm";

export default function DashboardHome({ hasToken, totalRequests, user }: { hasToken: boolean, totalRequests: number, user: any }) {
  const [tokenInput, setTokenInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isLinked, setIsLinked] = useState(hasToken);

  const linkToken = async () => {
    if (!tokenInput.trim()) {
      setStatus("error");
      setMessage("Please input a token.");
      return;
    }
    
    setStatus("loading");
    setMessage("Validating token...");

    try {
      const res = await fetch("/api/token/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "tokens invalid please retry.");
      }

      setStatus("success");
      setMessage("Token securely linked! You can now use the scraper.");
      setIsLinked(true);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "tokens invalid please retry.");
    }
  };

  return (
    <div>
      <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>welcome back <span className="title-gradient">{user.username}</span>.</h1>
      
      <div className="grid">
        <div className="glass-card">
          <h2 className="info-title">Global Analytics</h2>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-light)' }}>
            {totalRequests.toLocaleString()}
          </div>
          <p className="team-desc" style={{ textAlign: 'left', margin: 0 }}>Total Collectibles Exported</p>
        </div>

        <div className="glass-card">
          <h2 className="info-title">Authorization Settings</h2>
          {!isLinked ? (
            <div>
              <p className="info-text">You must link your Discord Authorization Token to scrape collectibles directly from the dashboard.</p>
              <div className="form-group">
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your Discord Token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>
              <button className="button" onClick={linkToken} disabled={status === "loading"}>
                {status === "loading" ? "Validating..." : "Link Token"}
              </button>
              {status !== "idle" && (
                <div className={`status-message status-${status}`}>{message}</div>
              )}
            </div>
          ) : (
            <div>
              <p className="info-text">Your Discord Authorization Token is linked securely.</p>
              <div className="alert-box">
                <strong>Status:</strong> Ready to scrape.
              </div>
              <button 
                className="button button-outline" 
                style={{ marginTop: '1rem', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setIsLinked(false)}
              >
                update your token.
              </button>
            </div>
          )}
        </div>
      </div>

      {isLinked && (
        <div style={{ marginTop: '2rem' }}>
          <h2 className="team-header" style={{ textAlign: 'left', fontSize: '2rem' }}>Quick <span className="highlight">Scrape</span></h2>
          <p className="team-desc" style={{ textAlign: 'left', margin: '0 0 2rem 0' }}>Run the scraper instantly using your linked token.</p>
          <ExportForm isDashboard={true} />
        </div>
      )}
    </div>
  );
}

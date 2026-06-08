"use client";

import { useState } from "react";

export default function ExportForm({ isDashboard = false }: { isDashboard?: boolean }) {
  const [token, setToken] = useState("");
  const [options, setOptions] = useState({
    decorations: true,
    nameplates: true,
    profileEffects: true,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({ ...options, [e.target.name]: e.target.checked });
  };

  const startScraping = async () => {
    if (!isDashboard && !token.trim()) {
      setStatus("error");
      setMessage("Please enter a valid Discord Token to proceed.");
      return;
    }

    if (!options.decorations && !options.nameplates && !options.profileEffects) {
      setStatus("error");
      setMessage("Please select at least one collectible type to scrape.");
      return;
    }

    setStatus("loading");
    setMessage("Connecting to Discord API and assembling your assets. This may take a minute...");

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, options }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process request. Please check your token.");
      }

      const data = await res.json();
      
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      
      const allTasks: { url: string, filepath: string, id: string }[] = data.tasks;
      const typesExported = data.typesExported || [];
      
      // Load previously downloaded items from localStorage
      let downloadedSet = new Set<string>();
      const saved = localStorage.getItem("decofinder_downloaded");
      if (saved) {
        try {
          const arr = JSON.parse(saved);
          downloadedSet = new Set(arr);
        } catch (e) {}
      }

      // Filter out items we've already downloaded
      const tasks = allTasks.filter(task => !downloadedSet.has(task.id));

      if (tasks.length === 0) {
        setStatus("success");
        setMessage("Decorations up to date, download full zip on the decorations page!.");
        return;
      }
      
      let completed = 0;
      setMessage(`Starting download of ${tasks.length} new items...`);
      
      // Download in batches to avoid overwhelming browser
      const batchSize = 10;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(async (task) => {
          try {
            // First try direct fetch (Discord CDN usually allows CORS)
            let imgRes = await fetch(task.url).catch(() => null);
            
            // If it failed (CORS or network), fallback to our proxy
            if (!imgRes || !imgRes.ok) {
              imgRes = await fetch(`/api/proxy?url=${encodeURIComponent(task.url)}`);
            }
            
            if (imgRes && imgRes.ok) {
              const blob = await imgRes.blob();
              zip.file(task.filepath, blob);
            }
          } catch (e) {
            console.error(`Failed to fetch ${task.url}:`, e);
          }
          completed++;
        }));
        // Update progress every batch
        setMessage(`Downloading items... ${Math.round((completed / tasks.length) * 100)}% (${completed}/${tasks.length})`);
      }

      setMessage("Compressing files into a ZIP archive... Please wait.");
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = "decofinder_export.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);

      // Save the newly downloaded tasks to localStorage
      tasks.forEach(task => downloadedSet.add(task.id));
      localStorage.setItem("decofinder_downloaded", JSON.stringify(Array.from(downloadedSet)));

      setStatus("success");
      setMessage(`Scraping Finished! Downloaded ${tasks.length} new items from ${typesExported.join(", ")}.`);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      
      let errorMessage = err.message || "An unexpected error occurred.";
      if (errorMessage === "Failed to fetch") {
        errorMessage = "Network Error (Failed to fetch). This usually means the connection timed out, an ad-blocker blocked the request, or the backend crashed. Try disabling your ad-blocker and try again.";
      }
      
      setMessage(errorMessage);
    }
  };

  return (
    <section className="glass-card">
      {!isDashboard && (
        <div className="form-group">
          <label className="label" htmlFor="token">Authorization Token</label>
          <input
            type="password"
            id="token"
            className="input"
            placeholder="Enter your Discord Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      )}

      <div className="form-group">
        <label className="label">Export Preferences</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="decorations"
              className="checkbox-input"
              checked={options.decorations}
              onChange={handleCheckboxChange}
            />
            Avatar Decorations
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="nameplates"
              className="checkbox-input"
              checked={options.nameplates}
              onChange={handleCheckboxChange}
            />
            Nameplates
          </label>
          <label className="checkbox-label" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <input
              type="checkbox"
              name="profileEffects"
              className="checkbox-input"
              checked={false}
              disabled={true}
              onChange={handleCheckboxChange}
            />
            Profile Effects (Coming Soon)
          </label>
        </div>
      </div>

      <button
        className="button"
        onClick={startScraping}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <>
            <span className="spinner"></span> Processing...
          </>
        ) : (
          "Initialize Export"
        )}
      </button>

      {status !== "idle" && (
        <div className={`status-message status-${status}`}>
          {message}
        </div>
      )}
    </section>
  );
}

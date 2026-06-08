"use client";

import { useState, useEffect } from "react";

export default function DecorationsClient({ collectibles }: { collectibles: any[] }) {
  const [filter, setFilter] = useState<"decorations" | "profile_effects" | "nameplates">("decorations");
  const [downloadedSet, setDownloadedSet] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Load previously downloaded items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("decofinder_downloaded");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        setDownloadedSet(new Set(arr));
      } catch (e) { }
    }
  }, []);

  const markAsDownloaded = (ids: string[]) => {
    const newSet = new Set(downloadedSet);
    ids.forEach(id => newSet.add(id));
    setDownloadedSet(newSet);
    localStorage.setItem("decofinder_downloaded", JSON.stringify(Array.from(newSet)));
  };

  const downloadSingleAsset = async (item: any) => {
    try {
      const res = await fetch(item.asset);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${item.name.replace(/[^a-zA-Z0-9]/g, "_")}.gif`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);

      markAsDownloaded([item.id]);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const downloadBulk = async (target: "all" | "decorations" | "profile_effects" | "nameplates") => {
    setStatus("loading");
    setMessage("Analyzing items...");

    // Filter items based on target
    let targetItems = collectibles;
    if (target !== "all") {
      targetItems = collectibles.filter(c => c.type === target);
    }

    // In the gallery, "Download All" downloads everything regardless of ownership
    const itemsToDownload = targetItems;
    
    // Deduplicate by URL to ensure no duplicates in the zip
    const uniqueMap = new Map<string, any>();
    itemsToDownload.forEach(item => {
      if (!uniqueMap.has(item.asset)) {
        uniqueMap.set(item.asset, item);
      }
    });
    const uniqueItems = Array.from(uniqueMap.values());

    if (uniqueItems.length === 0) {
      setStatus("success");
      setMessage("You have already exported all available items for this selection!");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let completed = 0;
      setMessage(`Starting download of ${uniqueItems.length} items...`);

      const batchSize = 10;
      for (let i = 0; i < uniqueItems.length; i += batchSize) {
        const batch = uniqueItems.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
          try {
            let imgRes = await fetch(item.asset).catch(() => null);
            if (!imgRes || !imgRes.ok) {
              imgRes = await fetch(`/api/proxy?url=${encodeURIComponent(item.asset)}`);
            }
            if (imgRes && imgRes.ok) {
              const blob = await imgRes.blob();
              const safeName = item.name.replace(/[^a-zA-Z0-9]/g, "_");
              const ext = ".gif"; 
              const safeId = item.id ? String(item.id).substring(0, 6) : "item";
              zip.file(`${item.type}/${safeName}_${safeId}${ext}`, blob);
            }
          } catch (e) {
            console.error(`Failed to fetch ${item.asset}:`, e);
          }
          completed++;
        }));
        setMessage(`Downloading items... ${Math.round((completed / uniqueItems.length) * 100)}% (${completed}/${uniqueItems.length})`);
      }

      setMessage("Compressing files into a ZIP archive...");
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      const filename = target === "all" ? "decofinder_new_exports" : `decofinder_${target}_exports`;
      a.download = `${filename}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);

      // Mark all these items as downloaded
      markAsDownloaded(uniqueItems.map(c => c.id));

      setStatus("success");
      setMessage(`Successfully exported ${uniqueItems.length} items!`);
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("An error occurred during bulk export.");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const filteredItems = collectibles.filter(item => item.type === filter);

  const getFilterLabel = () => {
    if (filter === "decorations") return "Decorations";
    if (filter === "profile_effects") return "Profile Effects";
    return "Nameplates";
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="title" style={{ fontSize: '2.5rem', margin: 0 }}>
          Digital <span className="title-gradient">Collectibles</span>
        </h1>
      </div>

      {status !== "idle" && (
        <div className={`status-message status-${status}`} style={{ marginBottom: '2rem' }}>
          {message}
        </div>
      )}

      <div className="filter-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter("decorations")}
            className={`button ${filter === "decorations" ? "" : "button-outline"}`}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: 'auto' }}
          >
            Decorations
          </button>
          <button
            onClick={() => setFilter("profile_effects")}
            className={`button ${filter === "profile_effects" ? "" : "button-outline"}`}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: 'auto' }}
          >
            Profile Effects
          </button>
          <button
            onClick={() => setFilter("nameplates")}
            className={`button ${filter === "nameplates" ? "" : "button-outline"}`}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: 'auto' }}
          >
            Nameplates
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="button button-outline"
            onClick={() => downloadBulk(filter)}
            disabled={status === "loading" || filter === "profile_effects"}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: 'auto' }}
          >
            Download {getFilterLabel()}
          </button>
          <button
            className="button"
            onClick={() => downloadBulk("all")}
            disabled={status === "loading"}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: 'auto' }}
          >
            {status === "loading" ? "Exporting..." : "Download All (Decorations, Profile Effects, Nameplates)"}
          </button>
        </div>
      </div>

      {filter === "profile_effects" ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
          <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Coming <span className="title-gradient">Soon.</span>
          </h2>
          <p className="subtitle" style={{ margin: '0 auto', maxWidth: '600px' }}>
            Profile Effects preview and scraping are currently unavailable. We are working on a fix for a future update!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {filteredItems.map((item, idx) => {
            const isDownloaded = downloadedSet.has(item.id);
            return (
              <div key={idx} className="glass-card deco-card" style={{ padding: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden', opacity: isDownloaded ? 0.6 : 1 }}>
                <div style={{ width: '100%', aspectRatio: filter === 'nameplates' ? '3/1' : '1/1', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}>
                  <img src={item.asset} alt={item.name} style={{ width: filter === 'nameplates' ? '100%' : '80%', height: filter === 'nameplates' ? '100%' : '80%', objectFit: 'contain' }} />
                  <div className="deco-overlay">
                    <button
                      className="button"
                      style={{ padding: '0.5rem', fontSize: '0.9rem', width: '80%' }}
                      onClick={() => downloadSingleAsset(item)}
                    >
                      {isDownloaded ? "Redownload" : "Download"}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </p>
                {isDownloaded && (
                  <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                    OWNED
                  </span>
                )}
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="info-text">No items found in this category.</p>
          )}
        </div>
      )}
    </div>
  );
}

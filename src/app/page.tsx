"use client";

import { useEffect } from "react";
import InfoSection from "@/components/InfoSection";
import ExportForm from "@/components/ExportForm";
import TrustSection from "@/components/TrustSection";
import TeamSection from "@/components/TeamSection";
import PromoModal from "@/components/PromoModal";

export default function Home() {
  // Smooth scroll and fade-in observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.fade-in');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <PromoModal />
      <div className="bg-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>

      <nav className="navbar">
        <div className="navbar-brand">decofinder.xyz</div>
        <div className="navbar-links">
          <a href="#hero">home.</a>
          <a href="#tool">tool.</a>
          <a href="#cli">cli version.</a>
          <a href="#team">team.</a>
          <a href="/dashboard" className="highlight" style={{ fontWeight: 'bold' }}>dashboard.</a>
        </div>
      </nav>

      <div className="layout">
        <header id="hero" className="hero fade-in">
          <h1 className="title">
            Your digital collectibles, <br />
            <span className="title-gradient">exported.</span>
          </h1>
          <p className="subtitle">
            The premier scraper dedicated to seamlessly exporting your profile decorations, nameplates, and effects to build your perfect digital identity.
          </p>
        </header>

        <main id="tool" className="content-wrapper">
          <div className="grid fade-in">
            <InfoSection />
            <ExportForm />
          </div>

          <hr className="divider fade-in" />
          <TrustSection />

          <div id="team">
            <hr className="divider fade-in" />
            <TeamSection />
          </div>
        </main>
      </div>
    </>
  );
}

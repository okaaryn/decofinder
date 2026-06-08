"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PromoModal() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hidePromo = localStorage.getItem("hidePromo");
    if (!hidePromo) {
      setIsMounted(true);
      // Trigger fade in after mount
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isMounted) return null;

  const handleClose = () => {
    setIsVisible(false);
    // Wait for transition before unmounting
    setTimeout(() => setIsMounted(false), 300);
  };

  const dismissForever = () => {
    localStorage.setItem("hidePromo", "true");
    handleClose();
  };

  return (
    <div 
      className="promo-overlay" 
      style={{ 
        opacity: isVisible ? 1 : 0, 
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      <div 
        className="glass-card promo-card" 
        style={{ 
          position: 'relative', 
          maxWidth: '500px', 
          width: '90%', 
          padding: '2.5rem', 
          textAlign: 'center', 
          zIndex: 1000,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          opacity: isVisible ? 1 : 0
        }}
      >
        <button 
          onClick={handleClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.7 }}
        >
          ✕
        </button>
        
        <h2 className="title" style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
          Tired of inputting your <span className="title-gradient">token?</span>
        </h2>
        
        <p className="subtitle" style={{ fontSize: '1rem', marginBottom: '2rem' }}>
          Introducing our beta version of the dashboard. Sign in with Discord, input your token once, and it is saved to our database—encrypted & safe.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/dashboard" className="button" style={{ padding: '0.8rem', fontSize: '1.1rem' }}>
            Go to Dashboard
          </Link>
          <button 
            onClick={dismissForever} 
            className="button button-outline" 
            style={{ padding: '0.8rem', fontSize: '0.9rem', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Don't show this message again
          </button>
        </div>
      </div>
    </div>
  );
}

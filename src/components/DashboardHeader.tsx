"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function DashboardHeader({ user }: { user: any }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ position: 'absolute', top: '2rem', right: '3rem', zIndex: 100 }}>
      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: 0,
            borderRadius: '50%',
            width: '45px',
            height: '45px',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.1)',
            transition: 'border-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-light)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <img 
            src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
            alt="Profile" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </button>

        {dropdownOpen && (
          <div className="glass-card" style={{
            position: 'absolute',
            top: '120%',
            right: 0,
            padding: '0.5rem',
            minWidth: '150px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            animation: 'slideDownCenter 0.2s ease forwards',
            transformOrigin: 'top right'
          }}>
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--error)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: '0.25rem',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

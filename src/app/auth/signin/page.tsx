"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  return (
    <div className="layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="bg-glows">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
      </div>
      
      <div className="glass-card fade-in visible" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Welcome <span className="highlight">Back</span>
        </h1>
        <p className="subtitle" style={{ fontSize: '1rem', marginBottom: '2.5rem' }}>
          Sign in with Discord to access your personalized dashboard and collectibles.
        </p>
        
        <button 
          className="button" 
          onClick={() => signIn("discord", { callbackUrl })}
          style={{ fontSize: '1.1rem', padding: '1rem' }}
        >
          Sign In with Discord
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="layout" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>}>
      <SignInContent />
    </Suspense>
  );
}

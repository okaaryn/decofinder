"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard" },
    { name: "Decorations", href: "/dashboard/decorations" },
  ];

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-brand">
        decofinder.<span style={{ color: '#0073ffff' }}>xyz</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <a 
          href="https://discord.gg/decofinder" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="button button-outline" 
          style={{ padding: '0.75rem', width: '100%', fontSize: '0.9rem', textAlign: 'center', display: 'inline-block', textDecoration: 'none' }}
        >
          Need support?
        </a>
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import { ArrowUpRight, Menu, Terminal, X } from 'lucide-react';
import { GITHUB_REPO_URL } from '../data/runtimeData';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: 'Core Features' },
    { href: '#architecture', label: 'Gateway :8080' },
    { href: '#modes', label: 'Modes' },
    { href: '#models', label: 'Model Catalog' },
    { href: '#install', label: 'Quick Install & Docs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090B0A]/90 backdrop-blur-md border-b border-[#1E2622]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Brand */}
        <a
          href="#"
          className="flex items-center gap-3 group focus:outline-none"
          aria-label="OpenCode Termux Unlimited Home"
        >
          <div className="w-8 h-8 bg-[#0F1311] border border-[#26322C] group-hover:border-[#10E88A]/60 transition-colors flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#10E88A]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-sm sm:text-base tracking-tight text-[#ECF2EE]">
              OpenCode <span className="text-[#10E88A]">Termux</span> Unlimited
            </span>
            <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono text-[#94A39B] bg-[#121715] border border-[#232D28] tabular-nums">
              v2.0.7
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs font-mono text-[#94A39B] hover:text-[#ECF2EE] transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#0F1311] border border-[#1E2622] text-[11px] font-mono text-[#94A39B] tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10E88A] animate-pulse-dot" />
            <span>127.0.0.1:8080 · WARP IPv6</span>
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-[#ECF2EE] bg-[#131816] border border-[#28342E] hover:border-[#10E88A]/70 hover:text-[#10E88A] transition-colors"
          >
            <span>GitHub Source</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden inline-flex items-center justify-center p-2 text-[#94A39B] hover:text-[#ECF2EE] border border-[#232D28] bg-[#0F1311] cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#1E2622] bg-[#0C0F0E] px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-xs font-mono text-[#C2CFC8] hover:text-[#10E88A] hover:bg-[#121715] border border-transparent hover:border-[#1E2622]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="pt-2 border-t border-[#1E2622] flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono text-[#94A39B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10E88A]" />
              aarch64 · No Root · No Docker
            </span>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-[#10E88A] border border-[#10E88A]/40 bg-[#10E88A]/10"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { ArrowUpRight, Github, Terminal } from 'lucide-react';
import { GITHUB_REPO_URL } from '../data/runtimeData';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Core Features', href: '#features' },
      { label: 'Gateway :8080', href: '#architecture' },
      { label: 'Two Modes', href: '#modes' },
      { label: 'Model Catalog', href: '#models' },
      { label: 'Quick Install', href: '#install' },
    ],
  },
  {
    title: 'Runtime',
    links: [
      { label: 'termux-chroot', href: '#features' },
      { label: 'glibc-runner', href: '#features' },
      { label: 'opencode2api', href: '#architecture' },
      { label: 'Cloudflare WARP IPv6', href: '#architecture' },
    ],
  },
  {
    title: 'Commands',
    links: [
      { label: 'opencode', href: '#install' },
      { label: 'opencode -1 / -2', href: '#install' },
      { label: 'opencode-proxy', href: '#install' },
      { label: 'opencode doctor', href: '#install' },
    ],
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1E2622] bg-[#080A09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-[#0F1311] border border-[#26322C] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-[#10E88A]" />
              </div>
              <span className="font-display font-semibold text-base text-[#ECF2EE]">
                OpenCode <span className="text-[#10E88A]">Termux</span> Unlimited
              </span>
            </div>
            <p className="text-xs text-[#7C8E84] leading-relaxed max-w-sm">
              Native OpenCode CLI for Android Termux with local WARP IPv6 rotation, a refusal-guard gateway on{' '}
              <code className="text-[#A8B7AF]">127.0.0.1:8080</code>, and zero rate limits.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-[10.5px] font-mono border border-[#25312B] bg-[#0F1412] text-[#94A39B]">
                v2.0.7
              </span>
              <span className="px-2 py-0.5 text-[10.5px] font-mono border border-[#25312B] bg-[#0F1412] text-[#94A39B]">
                MIT License
              </span>
              <span className="px-2 py-0.5 text-[10.5px] font-mono border border-[#10E88A]/30 bg-[#10E88A]/10 text-[#10E88A]">
                aarch64
              </span>
              <span className="px-2 py-0.5 text-[10.5px] font-mono border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]">
                no root · no docker
              </span>
            </div>

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#ECF2EE] border border-[#2A3731] bg-[#101513] hover:border-[#10E88A]/60 hover:text-[#10E88A] transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>leangtg123-art/opencode-termux-unlimited</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-[10.5px] font-mono uppercase tracking-wider text-[#6E7F76] mb-3">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-xs font-mono text-[#9AAA9F] hover:text-[#10E88A] transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-[#161D19] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] font-mono text-[#78897F]">
            Credits: <span className="text-[#94A39B]">leangtg123-art</span> &amp;{' '}
            <span className="text-[#94A39B]">leanianstudio</span> · MIT License
          </p>
          <p className="text-[11px] font-mono text-[#687A71] max-w-lg sm:text-right">
            Unofficial documentation site. Termux, Cloudflare WARP, and OpenCode are trademarks of their
            respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
};

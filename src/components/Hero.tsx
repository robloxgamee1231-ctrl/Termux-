import React from 'react';
import { ArrowRight, ArrowUpRight, Github, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { GITHUB_REPO_URL, INSTALL_COMMAND } from '../data/runtimeData';
import { CopyButton } from './CopyButton';
import { OpenCodeTerminal } from './OpenCodeTerminal';

const STATS = [
  { label: 'FREE MODELS', value: '10', suffix: 'online' },
  { label: 'WARP IPV6 EXITS', value: '6', suffix: 'workers' },
  { label: 'RETRY ATTEMPTS', value: '6x', suffix: 'on 429/403' },
  { label: 'ROOT / DOCKER', value: '0', suffix: 'required' },
];

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden border-b border-[#1E2622]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-terminal-grid bg-radial-mask opacity-60 pointer-events-none" aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 18% 8%, rgba(16,232,138,0.10), transparent 70%), radial-gradient(ellipse 45% 40% at 88% 22%, rgba(245,158,11,0.07), transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          {/* Left: Copy */}
          <div className="lg:col-span-6 xl:col-span-6">
            {/* Status pill */}
            <div className="inline-flex flex-wrap items-center gap-2 px-2.5 py-1 bg-[#0F1311] border border-[#24302A] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10E88A] animate-pulse-dot" />
              <span className="font-mono text-[11px] text-[#B8C7BF]">v2.0.7</span>
              <span className="text-[#3B4A43]">|</span>
              <span className="font-mono text-[11px] text-[#94A39B]">gateway live on 127.0.0.1:8080</span>
              <span className="text-[#3B4A43]">|</span>
              <span className="font-mono text-[11px] text-[#F59E0B]">WARP IPv6</span>
            </div>

            <h1 className="font-display text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.35rem] font-bold text-[#ECF2EE] tracking-tight">
              OpenCode <span className="text-[#10E88A]">Termux</span>
              <br />
              Unlimited
            </h1>

            {/* Tagline (verbatim) */}
            <p className="mt-5 text-[15px] sm:text-base text-[#C4D2CA] leading-relaxed max-w-xl">
              <span className="font-mono text-[#10E88A] select-none">&gt; </span>
              Run OpenCode CLI natively on Android with{' '}
              <span className="text-[#ECF2EE] font-medium">zero rate limits</span>. No root, no Docker.
            </p>

            <p className="mt-4 text-[13.5px] text-[#8A9A91] leading-relaxed max-w-xl">
              Bypasses free-tier quota limits (<code className="text-[#F59E0B]">HTTP 429</code>/
              <code className="text-[#F59E0B]">403</code>) via local{' '}
              <code className="text-[#ECF2EE]">opencode2api</code> with rotating Cloudflare WARP IPv6 exits.
              Built-in gateway on <code className="text-[#10E88A]">127.0.0.1:8080</code> intercepts
              false-positive safety refusals on system/audit tasks.
            </p>

            {/* Quick install command */}
            <div className="mt-7 border border-[#26332C] bg-[#0C100E] overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[#1B231F] bg-[#121815]">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#7C8E84]">
                  Quick Install (Termux)
                </span>
                <span className="font-mono text-[10.5px] text-[#78897F]">aarch64</span>
              </div>
              <div className="px-3 py-3 overflow-x-auto term-scroll">
                <pre className="font-mono text-[11px] sm:text-[11.5px] leading-relaxed whitespace-pre">
                  <span className="text-[#10E88A] select-none">$ </span>
                  <span className="text-[#DCE7E1]">{INSTALL_COMMAND}</span>
                </pre>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <CopyButton
                text={INSTALL_COMMAND}
                label="Copy install command"
                copiedLabel="Copied to clipboard"
                variant="primary"
                className="sm:w-auto"
              />
              <a
                href="#install"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-mono font-medium text-[#ECF2EE] bg-[#141A17] border border-[#2A3731] hover:border-[#10E88A]/60 hover:text-[#10E88A] transition-colors"
              >
                <span>Read the docs</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-mono text-[#94A39B] hover:text-[#ECF2EE] transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>Source</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Trust row */}
            <div className="mt-7 pt-5 border-t border-[#1B231F] flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-[#7C8E84]">
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#10E88A]" /> Native ARM64
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10E88A]" /> MIT Licensed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" /> 10 free models
              </span>
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="lg:sticky lg:top-20">
              <OpenCodeTerminal />

              {/* Stat strip */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#1E2622]">
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-3 bg-[#0C100E] border-r border-b border-[#1E2622]"
                  >
                    <div className="font-display text-xl sm:text-2xl font-bold text-[#ECF2EE] tabular-nums leading-none">
                      {stat.value}
                    </div>
                    <div className="mt-1.5 text-[9.5px] font-mono uppercase tracking-wider text-[#6E7F76]">
                      {stat.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#687A71] mt-0.5">{stat.suffix}</div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[11px] font-mono text-[#78897F] leading-relaxed">
                <span className="text-[#10E88A]">&gt;_</span> Interactive demo — click the terminal and type{' '}
                <span className="text-[#C8D5CE]">opencode</span>. Connect a local gateway or your own API key for
                live replies; otherwise everything is simulated in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

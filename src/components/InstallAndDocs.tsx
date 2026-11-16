import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileCode2,
  FolderTree,
  Play,
  Power,
  ShieldAlert,
  SquareTerminal,
  Stethoscope,
} from 'lucide-react';
import {
  CONFIG_JSON_EXAMPLE,
  FILE_LAYOUT_TREE,
  GITHUB_REPO_URL,
  INSTALL_COMMAND,
  LAUNCH_COMMAND,
  OPENCODE_JSONC_EXAMPLE,
  UNINSTALL_COMMAND,
} from '../data/runtimeData';
import { CopyButton } from './CopyButton';

const MODE_FLAGS = [
  {
    flag: 'opencode',
    title: 'Mode 1 · Free Unlimited',
    detail: 'Local opencode2api on 127.0.0.1:8080 with 6-worker WARP IPv6 rotation. No API key.',
  },
  {
    flag: 'opencode -1',
    title: 'Mode 1 · Explicit',
    detail: 'Force the unlimited free proxy path and restart the gateway daemon if it is cold.',
  },
  {
    flag: 'opencode -2',
    title: 'Mode 2 · + OpenRouter',
    detail: 'Adds the Python openrouter-bridge on 127.0.0.1:8085 for BYOK frontier models.',
  },
];

const PROXY_COMMANDS = ['opencode-proxy status', 'opencode-proxy restart', 'opencode-proxy test', 'opencode-proxy logs'];

export const InstallAndDocs: React.FC = () => {
  const [configTab, setConfigTab] = useState<'config.json' | 'opencode.jsonc'>('config.json');

  const activeConfig = configTab === 'config.json' ? CONFIG_JSON_EXAMPLE : OPENCODE_JSONC_EXAMPLE;

  return (
    <section id="install" className="py-20 sm:py-24 border-t border-[#1E2622] bg-[#0B0E0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#10E88A] mb-3">
            <span className="w-2 h-0.5 bg-[#10E88A]" />
            <span>Quick Install &amp; Documentation</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#ECF2EE]">
            One curl. Then type <code className="text-[#10E88A]">opencode</code>.
          </h2>
          <p className="mt-3 text-sm text-[#94A39B] leading-relaxed">
            The installer resolves your ARM64 architecture, links{' '}
            <code className="text-[#C8D5CE]">termux-chroot</code> +{' '}
            <code className="text-[#C8D5CE]">glibc-runner</code>, patches the OpenCode binary, and spawns the
            gateway daemon. No root, no Docker.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            {/* Install card */}
            <div className="bg-[#0F1412] border border-[#23302A]">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1E2622] bg-[#121815]">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#94A39B]">
                  <SquareTerminal className="w-3.5 h-3.5 text-[#10E88A]" />
                  <span>Quick Install (Termux)</span>
                </div>
                <CopyButton text={INSTALL_COMMAND} label="Copy" variant="subtle" />
              </div>
              <div className="p-4 overflow-x-auto term-scroll bg-[#090C0B]">
                <pre className="font-mono text-[11.5px] sm:text-xs leading-relaxed whitespace-pre">
                  <span className="text-[#10E88A] select-none">$ </span>
                  <span className="text-[#ECF2EE]">{INSTALL_COMMAND}</span>
                </pre>
              </div>
              <div className="px-4 py-3 border-t border-[#1E2622] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-[#7C8E84]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10E88A]" /> aarch64 only
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10E88A]" /> no root
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10E88A]" /> no Docker
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10E88A]" /> ~120 MB on disk
                </span>
              </div>
            </div>

            {/* Launch card */}
            <div className="bg-[#0F1412] border border-[#23302A]">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1E2622] bg-[#121815]">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#94A39B]">
                  <Play className="w-3.5 h-3.5 text-[#10E88A]" />
                  <span>Launch OpenCode</span>
                </div>
                <CopyButton text={LAUNCH_COMMAND} label="Copy" variant="subtle" />
              </div>
              <div className="p-4 bg-[#090C0B] flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <pre className="font-mono text-sm whitespace-pre">
                  <span className="text-[#10E88A] select-none">$ </span>
                  <span className="text-[#ECF2EE] font-semibold">{LAUNCH_COMMAND}</span>
                </pre>
                <span className="font-mono text-[11px] text-[#6E7F76]">
                  → boots gateway on 127.0.0.1:8080 if not already running
                </span>
              </div>
            </div>

            {/* Mode flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-[#1E2622]">
              {MODE_FLAGS.map((mode) => (
                <div
                  key={mode.flag}
                  className="p-4 bg-[#0C100E] border-r border-b border-[#1E2622] flex flex-col gap-2 hover:bg-[#101614] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-[#10E88A]">{mode.flag}</code>
                    <CopyButton text={mode.flag} label="copy" copiedLabel="ok" variant="inline" />
                  </div>
                  <div className="text-[11.5px] font-semibold text-[#E2EAE5] font-display">{mode.title}</div>
                  <p className="text-[11px] leading-relaxed text-[#8A9A91]">{mode.detail}</p>
                </div>
              ))}
            </div>

            {/* Daemon control */}
            <div className="bg-[#0F1412] border border-[#23302A]">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1E2622] bg-[#121815]">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#94A39B]">
                  <Power className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Gateway Daemon Control</span>
                </div>
                <span className="font-mono text-[10.5px] text-[#78897F]">setsid() double-fork</span>
              </div>
              <div className="divide-y divide-[#1A221E]">
                {PROXY_COMMANDS.map((cmd) => (
                  <div
                    key={cmd}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 group hover:bg-[#101614] transition-colors"
                  >
                    <code className="font-mono text-xs text-[#D3DFD8] break-all">
                      <span className="text-[#78897F] select-none">$ </span>
                      {cmd}
                    </code>
                    <CopyButton text={cmd} label="copy" copiedLabel="ok" variant="inline" className="shrink-0" />
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[#1E2622] flex flex-wrap items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1.5 text-[#94A39B]">
                  <Stethoscope className="w-3.5 h-3.5 text-[#10E88A]" />
                  <span className="text-[#C8D5CE]">opencode doctor</span>
                </span>
                <span className="text-[#3B4A43]">·</span>
                <span className="text-[#C8D5CE]">opencode repair</span>
                <span className="text-[#3B4A43]">·</span>
                <span className="text-[#C8D5CE]">opencode update</span>
              </div>
            </div>

            {/* Advisory */}
            <div className="bg-[#F59E0B]/[0.06] border border-[#F59E0B]/35 p-4 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[#E8D5AE]">
                <span className="font-semibold text-[#F59E0B]">Do not run npm update -g opencode.</span>{' '}
                OpenCode v2.x child-daemon <code className="text-[#FCD34D]">execve</code> crashes on the Android
                Bionic linker (Exit 127), and <code className="text-[#FCD34D]">patchelf</code> corrupts the Bun
                trailer (Exit 139). This project pins patched{' '}
                <code className="text-[#FCD34D]">v1.19.5</code> and sets{' '}
                <code className="text-[#FCD34D]">autoupdate: false</code>. Use{' '}
                <code className="text-[#FCD34D]">opencode update</code> instead.
              </div>
            </div>

            {/* Uninstall */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#0C100E] border border-[#1E2622]">
              <div className="font-mono text-[11px] text-[#7C8E84] break-all">
                <span className="text-[#78897F]"># clean removal →</span> {UNINSTALL_COMMAND}
              </div>
              <CopyButton text={UNINSTALL_COMMAND} label="copy" copiedLabel="ok" variant="inline" className="shrink-0" />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-6">
            {/* Config tabs */}
            <div className="bg-[#0F1412] border border-[#23302A] flex flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-[#1E2622] bg-[#121815]">
                <div className="flex">
                  {(['config.json', 'opencode.jsonc'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setConfigTab(tab)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-mono border-r border-[#1E2622] transition-colors cursor-pointer ${
                        configTab === tab
                          ? 'bg-[#0F1412] text-[#10E88A] border-t border-t-[#10E88A]'
                          : 'text-[#8A9A91] hover:text-[#ECF2EE]'
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="pr-3">
                  <CopyButton text={activeConfig} label="copy" copiedLabel="ok" variant="inline" />
                </div>
              </div>
              <div className="p-4 bg-[#090C0B] max-h-[360px] overflow-auto term-scroll">
                <pre className="font-mono text-[11px] leading-relaxed text-[#C2D0C9] whitespace-pre">{activeConfig}</pre>
              </div>
              <div className="px-4 py-2.5 border-t border-[#1E2622] font-mono text-[10.5px] text-[#78897F]">
                {configTab === 'config.json'
                  ? '~/.opencode-proxy/config.json — gateway, WARP pool & retry policy'
                  : '~/.config/opencode/opencode.jsonc — provider wiring & reasoning variants'}
              </div>
            </div>

            {/* File tree */}
            <div className="bg-[#0F1412] border border-[#23302A]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1E2622] bg-[#121815] font-mono text-[11px] uppercase tracking-wider text-[#94A39B]">
                <FolderTree className="w-3.5 h-3.5 text-[#10E88A]" />
                <span>Installed Layout</span>
              </div>
              <div className="p-4 bg-[#090C0B] overflow-x-auto term-scroll">
                <pre className="font-mono text-[10.5px] leading-[1.75] text-[#A8B7AF] whitespace-pre">
                  {FILE_LAYOUT_TREE}
                </pre>
              </div>
            </div>

            {/* Source CTA */}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-4 bg-[#10E88A]/[0.07] border border-[#10E88A]/30 hover:border-[#10E88A]/70 hover:bg-[#10E88A]/[0.11] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#10E88A] mb-1">
                    Source &amp; Architecture
                  </div>
                  <div className="text-sm font-semibold text-[#ECF2EE] font-display">
                    leangtg123-art / opencode-termux-unlimited
                  </div>
                  <div className="text-[11px] font-mono text-[#8A9A91] mt-0.5">
                    MIT License · v2.0.7 · install.sh
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#10E88A] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>

            {/* Mode 2 note */}
            <div className="p-4 bg-[#0C100E] border border-[#1E2622] flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed text-[#97A79E]">
                Mode 2 requires your own{' '}
                <code className="text-[#C8D5CE]">OPENROUTER_API_KEY</code>. The bridge is pure Python stdlib —
                no pip packages, no extra runtime to babysit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

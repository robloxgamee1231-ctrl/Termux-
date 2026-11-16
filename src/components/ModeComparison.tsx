import React, { useState } from 'react';
import { Check, Layers, Lock, Zap } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface ModeSpec {
  id: 'mode1' | 'mode2';
  tab: string;
  port: string;
  title: string;
  command: string;
  lead: string;
  requirement: string;
  specs: string[];
  extras?: { label: string; value: string }[];
}

const MODES: ModeSpec[] = [
  {
    id: 'mode1',
    tab: 'Mode 1',
    port: '127.0.0.1:8080',
    title: 'Free Unlimited Proxy',
    command: 'opencode',
    lead: 'Local opencode2api gateway. No API key, no account, no quota ceiling.',
    requirement: 'Nothing to configure — the installer wires it up.',
    specs: [
      '10 free models behind one OpenAI-compatible endpoint',
      '6-worker Cloudflare WARP IPv6 pool with automatic 429/403 rotation',
      '6 retry attempts before the TUI ever sees an error',
      'WebUI telemetry on 127.0.0.1:8081',
    ],
    extras: [
      { label: 'API KEY', value: 'local-test-key' },
      { label: 'BASE URL', value: 'http://127.0.0.1:8080/v1' },
    ],
  },
  {
    id: 'mode2',
    tab: 'Mode 2',
    port: '127.0.0.1:8085',
    title: 'OpenRouter Bridge',
    command: 'opencode -2',
    lead: 'Adds a pure Python stdlib bridge for Bring-Your-Own-Key frontier models.',
    requirement: 'Requires your own OPENROUTER_API_KEY.',
    specs: [
      'Smart Egress Auto-Probe picks the fastest upstream path',
      'Claude 3.7 Sonnet, GPT-4o and o3-mini available alongside Mode 1',
      'No pip packages — stdlib only, daemonized like the main gateway',
      'Mode 1 pool stays live as the fallback tier',
    ],
    extras: [
      { label: 'API KEY', value: 'OPENROUTER_API_KEY' },
      { label: 'BASE URL', value: 'http://127.0.0.1:8085/v1' },
    ],
  },
];

export const ModeComparison: React.FC = () => {
  const [active, setActive] = useState<'mode1' | 'mode2'>('mode1');

  return (
    <section id="modes" className="py-16 sm:py-20 border-t border-[#1E2622] bg-[#090B0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#10E88A] mb-3">
              <span className="w-2 h-0.5 bg-[#10E88A]" />
              <span>Two Modes · One Launcher</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#ECF2EE]">
              Free by default. Frontier on demand.
            </h2>
          </div>

          <div className="inline-flex border border-[#25312B] bg-[#0F1412] p-0.5 self-start">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m.id)}
                className={`px-4 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                  active === m.id
                    ? 'bg-[#10E88A] text-[#06110B] font-semibold'
                    : 'text-[#8D9E95] hover:text-[#ECF2EE]'
                }`}
              >
                {m.tab}
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-side panels with the active one emphasized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 md:border-l md:border-t md:border-[#1E2622]">
          {MODES.map((item) => {
            const isActive = item.id === active;
            const isFree = item.id === 'mode1';

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActive(item.id)}
                className={`md:border-r md:border-b md:border-[#1E2622] p-5 sm:p-6 flex flex-col gap-4 transition-colors border ${
                  isActive
                    ? isFree
                      ? 'bg-[#0E1512] border-[#10E88A]/40 md:border-[#1E2622]'
                      : 'bg-[#151208] border-[#F59E0B]/40 md:border-[#1E2622]'
                    : 'bg-[#0B0F0D] border-[#1A231E] md:border-[#1E2622]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border ${
                          isFree
                            ? 'border-[#10E88A]/35 bg-[#10E88A]/10 text-[#10E88A]'
                            : 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#F59E0B]'
                        }`}
                      >
                        {isFree ? <Zap className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                        {item.port}
                      </span>
                      <span className="text-[10px] font-mono text-[#78897F] uppercase tracking-wider">
                        {item.tab}
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-semibold text-[#ECF2EE]">
                      {item.title}
                    </h3>
                  </div>
                  <code
                    className={`text-[11px] font-mono px-2 py-1 border shrink-0 ${
                      isFree
                        ? 'border-[#10E88A]/30 bg-[#090C0B] text-[#10E88A]'
                        : 'border-[#F59E0B]/30 bg-[#090C0B] text-[#F59E0B]'
                    }`}
                  >
                    {item.command}
                  </code>
                </div>

                <p className="text-[13px] leading-relaxed text-[#A5B4AC]">{item.lead}</p>

                <ul className="space-y-2">
                  {item.specs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2 text-xs text-[#C8D5CE] leading-relaxed">
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isFree ? 'text-[#10E88A]' : 'text-[#F59E0B]'}`}
                      />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-3 border-t border-[#1A231E] space-y-1.5 font-mono text-[10.5px]">
                  {item.extras?.map((extra) => (
                    <div key={extra.label} className="flex items-center justify-between gap-3">
                      <span className="text-[#78897F] uppercase tracking-wider">{extra.label}</span>
                      <span className="text-[#C8D5CE] truncate">{extra.value}</span>
                    </div>
                  ))}
                  <div className="flex items-start justify-between gap-3 pt-1.5">
                    <span className="text-[#78897F] uppercase tracking-wider shrink-0">REQUIRES</span>
                    <span className="text-right text-[#94A39B] leading-snug">{item.requirement}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[#78897F]">
                    <Lock className="w-3 h-3" /> localhost only
                  </span>
                  <CopyButton text={item.command} label="copy" copiedLabel="ok" variant="inline" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

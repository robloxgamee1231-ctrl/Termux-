import React from 'react';
import { Cpu, Layers, RefreshCw, Server } from 'lucide-react';
import { CORE_FEATURES } from '../data/runtimeData';

const FEATURE_ICONS = [Cpu, RefreshCw, Layers, Server];

export const CoreFeaturesGrid: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-24 border-t border-[#1E2622] bg-[#090B0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#10E88A] mb-3">
              <span className="w-2 h-0.5 bg-[#10E88A]" />
              <span>Core Features · Native Runtime Engineering</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#ECF2EE]">
              Built for bare-metal Android Termux—not fragile container shims.
            </h2>
          </div>
          <p className="text-sm font-mono text-[#7C8E84] max-w-sm tabular-nums">
            Zero root permissions · Zero Docker daemon · Direct ARM64 execution via glibc-runner + local Go gateway.
          </p>
        </div>

        {/* Hairline 2x2 Architectural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[#1E2622]">
          {CORE_FEATURES.map((feature, idx) => {
            const Icon = FEATURE_ICONS[idx] || Cpu;
            const isAmber = feature.accent === 'amber';

            return (
              <div
                key={feature.index}
                className="group relative bg-[#0C100E] hover:bg-[#0F1512] transition-colors border-r border-b border-[#1E2622] p-6 sm:p-8 flex flex-col justify-between gap-6"
              >
                <div>
                  {/* Cell Top Row */}
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#78897F] tabular-nums">
                        [{feature.index}]
                      </span>
                      <div
                        className={`w-9 h-9 flex items-center justify-center border ${
                          isAmber
                            ? 'bg-[#F59E0B]/10 border-[#F59E0B]/35 text-[#F59E0B]'
                            : 'bg-[#10E88A]/10 border-[#10E88A]/35 text-[#10E88A]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[11px] font-mono border tabular-nums ${
                        isAmber
                          ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                          : 'bg-[#121916] border-[#25322C] text-[#94A39B]'
                      }`}
                    >
                      {feature.specBadge}
                    </span>
                  </div>

                  {/* Feature Title + Exact User Lead */}
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#ECF2EE] mb-2">
                    {feature.title}
                  </h3>
                  <p
                    className={`font-mono text-xs sm:text-[13px] font-medium mb-3.5 ${
                      isAmber ? 'text-[#F59E0B]' : 'text-[#10E88A]'
                    }`}
                  >
                    {feature.shortLead}
                  </p>
                  <p className="text-sm text-[#94A39B] leading-relaxed">{feature.detail}</p>
                </div>

                {/* Telemetry Spec Bar */}
                <div className="pt-4 border-t border-[#1A221E] flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-[#78897F] uppercase tracking-wider">{feature.runtimeKey}</span>
                  <span className="text-[#C7D4CD] truncate tabular-nums">{feature.runtimeVal}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

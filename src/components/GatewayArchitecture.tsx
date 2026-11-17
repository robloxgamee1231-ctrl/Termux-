import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  Network,
  Radio,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { ARCH_NODES } from '../data/runtimeData';

type SimulationMode = 'normal' | 'ratelimit' | 'audit';

interface WarpWorker {
  id: number;
  ipv6: string;
  role: 'ACTIVE' | 'STANDBY' | 'ROTATING' | 'COOLDOWN';
  rtt: string;
}

export const GatewayArchitecture: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('gateway');
  const [simMode, setSimMode] = useState<SimulationMode>('normal');

  const selectedNode = ARCH_NODES.find((n) => n.id === selectedNodeId) || ARCH_NODES[1];

  const getWarpWorkers = (): WarpWorker[] => {
    if (simMode === 'ratelimit') {
      return [
        { id: 1, ipv6: '2a09:bac1:7680::2f9', role: 'COOLDOWN', rtt: '429 hit' },
        { id: 2, ipv6: '2a09:bac5:3910::c41', role: 'ROTATING', rtt: '28ms' },
        { id: 3, ipv6: '2a09:bac1:7680::8b0', role: 'ACTIVE', rtt: '31ms' },
        { id: 4, ipv6: '2a09:bac5:41a0::11e', role: 'ACTIVE', rtt: '34ms' },
        { id: 5, ipv6: '2a09:bac1:9020::7d2', role: 'STANDBY', rtt: 'warm' },
        { id: 6, ipv6: '2a09:bac5:12c0::5a4', role: 'STANDBY', rtt: 'warm' },
      ];
    }
    return [
      { id: 1, ipv6: '2a09:bac1:7680::2f9', role: 'ACTIVE', rtt: '24ms' },
      { id: 2, ipv6: '2a09:bac5:3910::c41', role: 'ACTIVE', rtt: '28ms' },
      { id: 3, ipv6: '2a09:bac1:7680::8b0', role: 'ACTIVE', rtt: '31ms' },
      { id: 4, ipv6: '2a09:bac5:41a0::11e', role: 'STANDBY', rtt: 'warm' },
      { id: 5, ipv6: '2a09:bac1:9020::7d2', role: 'STANDBY', rtt: 'warm' },
      { id: 6, ipv6: '2a09:bac5:12c0::5a4', role: 'STANDBY', rtt: 'warm' },
    ];
  };

  const workers = getWarpWorkers();

  return (
    <section id="architecture" className="py-20 sm:py-24 border-t border-[#1E2622] bg-[#0B0E0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Interactive Simulation Trigger */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#10E88A] mb-3">
              <span className="w-2 h-0.5 bg-[#10E88A]" />
              <span>System Architecture · 127.0.0.1:8080 Local Gateway</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#ECF2EE]">
              How rate limits &amp; false-positive refusals get neutralized locally.
            </h2>
          </div>

          {/* Interactive Stress Event Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[#6E7F76] mr-1 uppercase">Simulate:</span>
            <button
              type="button"
              onClick={() => {
                setSimMode('normal');
              }}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                simMode === 'normal'
                  ? 'bg-[#10E88A]/15 border-[#10E88A] text-[#10E88A] font-semibold'
                  : 'bg-[#101513] border-[#25302B] text-[#94A39B] hover:text-[#ECF2EE]'
              }`}
            >
              Normal SSE
            </button>
            <button
              type="button"
              onClick={() => {
                setSimMode('ratelimit');
                setSelectedNodeId('warp');
              }}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                simMode === 'ratelimit'
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] font-semibold'
                  : 'bg-[#101513] border-[#25302B] text-[#94A39B] hover:text-[#ECF2EE]'
              }`}
            >
              HTTP 429/403 Hit
            </button>
            <button
              type="button"
              onClick={() => {
                setSimMode('audit');
                setSelectedNodeId('gateway');
              }}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                simMode === 'audit'
                  ? 'bg-[#10E88A]/15 border-[#10E88A] text-[#10E88A] font-semibold'
                  : 'bg-[#101513] border-[#25302B] text-[#94A39B] hover:text-[#ECF2EE]'
              }`}
            >
              Audit Refusal Guard
            </button>
          </div>
        </div>

        {/* Live Telemetry Banner for Current Simulation State */}
        <div
          className={`mb-6 px-4 py-3 border font-mono text-xs flex flex-wrap items-center justify-between gap-3 ${
            simMode === 'ratelimit'
              ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#FCD34D]'
              : simMode === 'audit'
              ? 'bg-[#10E88A]/10 border-[#10E88A]/40 text-[#6EE7B7]'
              : 'bg-[#101613] border-[#222C27] text-[#A4B4AC]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {simMode === 'ratelimit' ? (
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
            ) : simMode === 'audit' ? (
              <ShieldAlert className="w-4 h-4 text-[#10E88A] shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-[#10E88A] shrink-0" />
            )}
            <span>
              {simMode === 'ratelimit' &&
                'EVENT: Upstream returned HTTP 429 on exit 2a09:bac1:7680::2f9 → opencode2api rotated WARP IPv6 worker #2 & swapped failover pool in 38ms.'}
              {simMode === 'audit' &&
                'EVENT: False-positive safety refusal detected on system/audit prompt → 127.0.0.1:8080 gateway normalized audit framing & fulfilled via flint-40b.'}
              {simMode === 'normal' &&
                'PIPELINE HEALTHY: OpenCode TUI (grun) → 127.0.0.1:8080 (opencode2api) → WARP IPv6 Worker #1 → deepseek-v4.1 (TTFT 184ms).'}
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-wider opacity-80 shrink-0">
            Click any stage below to inspect
          </span>
        </div>

        {/* 4-Stage Interactive Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
          {ARCH_NODES.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            const isHighlightedAmber = simMode === 'ratelimit' && (node.id === 'warp' || node.id === 'pool');
            const isHighlightedAudit = simMode === 'audit' && node.id === 'gateway';

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={`text-left p-5 border transition-all cursor-pointer relative flex flex-col justify-between gap-4 ${
                  isSelected
                    ? isHighlightedAmber
                      ? 'bg-[#17150F] border-[#F59E0B] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]'
                      : 'bg-[#111915] border-[#10E88A] shadow-[inset_0_0_0_1px_rgba(16,232,138,0.25)]'
                    : 'bg-[#0E1210] border-[#1E2622] hover:border-[#324039] hover:bg-[#111614]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono tracking-wider text-[#687A70] uppercase">
                      {node.stage}
                    </span>
                    {index < ARCH_NODES.length - 1 && (
                      <ArrowRight className="hidden lg:block w-3.5 h-3.5 text-[#46564E]" />
                    )}
                  </div>

                  <h3 className="font-display text-base font-semibold text-[#ECF2EE] mb-1">
                    {node.title}
                  </h3>
                  <p className="text-xs font-mono text-[#8FA197]">{node.subtitle}</p>
                </div>

                <div className="pt-3 border-t border-[#1B231F] flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                  <span
                    className={
                      isHighlightedAmber
                        ? 'text-[#F59E0B] font-semibold'
                        : isHighlightedAudit || isSelected
                        ? 'text-[#10E88A] font-semibold'
                        : 'text-[#B5C4BC]'
                    }
                  >
                    {node.binaryOrPort}
                  </span>
                  <span className="text-[#78897F]">{isSelected ? 'INSPECTING' : 'SELECT'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Split: Selected Stage Spec Inspector + Live 6-Worker WARP IPv6 Pool */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 cols: Stage Technical Readout */}
          <div className="lg:col-span-7 bg-[#0E1311] border border-[#1E2622] p-6 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1C2420]">
                <div>
                  <span className="text-[11px] font-mono text-[#10E88A] uppercase tracking-wider">
                    {selectedNode.stage}
                  </span>
                  <h4 className="font-display text-xl font-semibold text-[#ECF2EE] mt-0.5">
                    {selectedNode.title}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#090B0A] border border-[#24302A] text-xs font-mono text-[#B8C7BF]">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#10E88A]" />
                  <span>{selectedNode.path}</span>
                </span>
              </div>

              <p className="text-sm text-[#A5B4AC] leading-relaxed mb-5">{selectedNode.summary}</p>

              <ul className="space-y-2.5">
                {selectedNode.highlights.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#D3DFD8]">
                    <CheckCircle2 className="w-4 h-4 text-[#10E88A] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dual Mode Quick Note */}
            <div className="p-3.5 bg-[#090C0B] border border-[#1D2621] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#94A39B]">
                <Zap className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>
                  Dual Gateway Mode (<code className="text-[#ECF2EE]">opencode -2</code>) adds OpenRouter Bridge on{' '}
                  <code className="text-[#10E88A]">127.0.0.1:8085</code>
                </span>
              </div>
              <span className="text-[#78897F] shrink-0 tabular-nums">WebUI: 127.0.0.1:8081</span>
            </div>
          </div>

          {/* Right 5 cols: 6-Worker Cloudflare WARP IPv6 Egress Pool Visualizer */}
          <div className="lg:col-span-5 bg-[#0E1311] border border-[#1E2622] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#1C2420]">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#F59E0B]" />
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#ECF2EE]">
                    Cloudflare WARP IPv6 Pool (6x)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#10E88A] bg-[#10E88A]/10 border border-[#10E88A]/30 px-2 py-0.5">
                  &quot;stack&quot;: &quot;ipv6&quot;
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs tabular-nums">
                {workers.map((w) => {
                  const isCooldown = w.role === 'COOLDOWN';
                  const isRotating = w.role === 'ROTATING';
                  const isActive = w.role === 'ACTIVE';

                  return (
                    <div
                      key={w.id}
                      className={`px-3 py-2 border flex items-center justify-between gap-2 ${
                        isCooldown
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#FCA5A5]'
                          : isRotating
                          ? 'bg-[#F59E0B]/15 border-[#F59E0B]/60 text-[#FDE68A]'
                          : isActive
                          ? 'bg-[#0A0E0C] border-[#223029] text-[#D8E4DD]'
                          : 'bg-[#090B0A] border-[#18201C] text-[#6E7F76]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Radio
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isCooldown
                              ? 'text-[#EF4444]'
                              : isRotating
                              ? 'text-[#F59E0B]'
                              : isActive
                              ? 'text-[#10E88A]'
                              : 'text-[#687A71]'
                          }`}
                        />
                        <span className="text-[#6E7F76]">#{w.id}</span>
                        <span className="truncate">{w.ipv6}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        <span className="opacity-75">{w.rtt}</span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] border ${
                            isCooldown
                              ? 'border-[#EF4444]/50 text-[#EF4444]'
                              : isRotating
                              ? 'border-[#F59E0B]/60 text-[#F59E0B]'
                              : isActive
                              ? 'border-[#10E88A]/40 text-[#10E88A]'
                              : 'border-[#25302B] text-[#6E7F76]'
                          }`}
                        >
                          {w.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 pt-3 border-t border-[#1C2420] text-[11px] font-mono text-[#788A81] leading-relaxed">
              Dedicated unicast IPv6 exits bypass shared Cloudflare <code className="text-[#B8C7BF]">104.28.x.x</code>{' '}
              IPv4 NAT congestion that triggers upstream global 429 blocks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

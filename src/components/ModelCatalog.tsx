import React, { useMemo, useState } from 'react';
import { Check, Layers, Search, Terminal, Zap } from 'lucide-react';
import { MODEL_CATALOG } from '../data/runtimeData';
import { CopyButton } from './CopyButton';

type ModeFilter = 'all' | 'mode1' | 'mode2';

export const ModelCatalog: React.FC = () => {
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredModels = useMemo(() => {
    return MODEL_CATALOG.filter((model) => {
      const matchesMode = modeFilter === 'all' || model.mode === modeFilter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        model.id.toLowerCase().includes(q) ||
        model.provider.toLowerCase().includes(q) ||
        model.capabilities.toLowerCase().includes(q);
      return matchesMode && matchesQuery;
    });
  }, [query, modeFilter]);

  const copyModelCommand = async (modelId: string) => {
    const cmd = `opencode -m opencode-unlimited-proxy/${modelId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cmd);
      } else {
        throw new Error('unavailable');
      }
    } catch {
      const el = document.createElement('textarea');
      el.value = cmd;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
      } catch {
        // noop
      }
      document.body.removeChild(el);
    }
    setCopiedId(modelId);
    window.setTimeout(() => setCopiedId((prev) => (prev === modelId ? null : prev)), 2000);
  };

  const mode1Count = MODEL_CATALOG.filter((m) => m.mode === 'mode1').length;
  const mode2Count = MODEL_CATALOG.filter((m) => m.mode === 'mode2').length;

  return (
    <section id="models" className="py-20 sm:py-24 border-t border-[#1E2622] bg-[#090B0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#10E88A] mb-3">
              <span className="w-2 h-0.5 bg-[#10E88A]" />
              <span>Model Catalog · Failover Pool</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#ECF2EE]">
              {mode1Count} free unlimited models. Instant mid-session failover.
            </h2>
            <p className="mt-3 text-sm text-[#94A39B] leading-relaxed">
              Mode 1 routes every request through{' '}
              <code className="text-[#10E88A] bg-[#10E88A]/10 px-1.5 py-0.5 border border-[#10E88A]/25">
                127.0.0.1:8080/v1
              </code>{' '}
              with zero API keys. Mode 2 unlocks Bring-Your-Own-Key OpenRouter frontier models via the{' '}
              <code className="text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 border border-[#F59E0B]/25">
                127.0.0.1:8085
              </code>{' '}
              bridge.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#78897F]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter models..."
                className="w-full sm:w-56 pl-9 pr-3 py-2 bg-[#0F1412] border border-[#25312B] text-xs font-mono text-[#ECF2EE] placeholder:text-[#78897F] focus:outline-none focus:border-[#10E88A]/70 focus:bg-[#111816] transition-colors"
                aria-label="Search model catalog"
              />
            </div>

            {/* Mode toggle */}
            <div className="inline-flex border border-[#25312B] bg-[#0F1412] p-0.5">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'mode1', label: 'Mode 1 · :8080' },
                  { key: 'mode2', label: 'Mode 2 · :8085' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setModeFilter(tab.key)}
                  className={`px-3 py-1.5 text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                    modeFilter === tab.key
                      ? 'bg-[#10E88A] text-[#06110B] font-semibold'
                      : 'text-[#8D9E95] hover:text-[#ECF2EE]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#1E2622] bg-[#0C100E] overflow-hidden">
          <div className="overflow-x-auto term-scroll">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-[#111614] border-b border-[#1E2622] text-[10.5px] font-mono uppercase tracking-wider text-[#6E7F76]">
                  <th className="px-4 py-3 font-medium">Model ID</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium text-right">Context</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium text-right">Launch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A221E]">
                {filteredModels.map((model) => {
                  const isMode2 = model.mode === 'mode2';
                  return (
                    <tr
                      key={model.id}
                      className="hover:bg-[#101714] transition-colors group align-middle"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs sm:text-[12.5px] text-[#ECF2EE] group-hover:text-[#10E88A] transition-colors">
                          {model.id}
                        </div>
                        <div className="text-[11px] font-mono text-[#78897F] mt-0.5">
                          alias: {model.shortAlias}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-[#A8B7AF] whitespace-nowrap">
                        {model.provider}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[#C8D5CE] tabular-nums whitespace-nowrap">
                        {model.context}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-mono border ${
                            isMode2
                              ? 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#F59E0B]'
                              : 'border-[#10E88A]/30 bg-[#10E88A]/10 text-[#10E88A]'
                          }`}
                        >
                          {isMode2 ? <Layers className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                          {isMode2 ? ':8085' : ':8080'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {model.badge ? (
                            <span
                              className={`inline-flex w-fit px-1.5 py-0.5 text-[10px] font-mono border ${
                                model.isPrimaryFailover
                                  ? 'border-[#10E88A]/40 bg-[#10E88A]/10 text-[#10E88A]'
                                  : isMode2
                                  ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[#F0B24B]'
                                  : 'border-[#2B3831] bg-[#131A16] text-[#A8B7AF]'
                              }`}
                            >
                              {model.badge}
                            </span>
                          ) : (
                            <span className="inline-flex w-fit px-1.5 py-0.5 text-[10px] font-mono border border-[#2B3831] bg-[#131A16] text-[#8D9E95]">
                              EXTENDED POOL
                            </span>
                          )}
                          <span className="text-[11px] text-[#7C8E84] leading-snug max-w-[280px]">
                            {model.capabilities}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => copyModelCommand(model.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border transition-colors cursor-pointer whitespace-nowrap ${
                            copiedId === model.id
                              ? 'border-[#10E88A] bg-[#10E88A]/15 text-[#10E88A]'
                              : 'border-[#26312C] bg-[#111715] text-[#94A39B] hover:text-[#ECF2EE] hover:border-[#3A4B43]'
                          }`}
                          title={`Copy: opencode -m opencode-unlimited-proxy/${model.id}`}
                        >
                          {copiedId === model.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Terminal className="w-3.5 h-3.5" />
                              <span>-m</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredModels.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-mono text-[#8D9E95]">
                No models matched <span className="text-[#ECF2EE]">&quot;{query}&quot;</span>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setModeFilter('all');
                }}
                className="mt-3 text-xs font-mono text-[#10E88A] underline underline-offset-4 cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Footer Meta Row */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono text-[#6E7F76]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="tabular-nums">
              Showing{' '}
              <span className="text-[#ECF2EE]">{filteredModels.length}</span> / {MODEL_CATALOG.length}{' '}
              models
            </span>
            <span className="tabular-nums">
              Mode 1 free unlimited: <span className="text-[#10E88A]">{mode1Count}</span>
            </span>
            <span className="tabular-nums">
              Mode 2 OpenRouter: <span className="text-[#F59E0B]">{mode2Count}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Auto-refresh every</span>
            <span className="text-[#C8D5CE]">300s</span>
            <span className="text-[#3B4A43]">·</span>
            <span>&quot;free_only&quot;: true</span>
          </div>
        </div>

        {/* Model ID copy helper */}
        <div className="mt-6 p-4 bg-[#0C100E] border border-[#1E2622] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-mono text-xs text-[#8D9E95]">
            <span className="text-[#78897F]"># pin a model per-session →</span>{' '}
            <span className="text-[#ECF2EE] break-all">
              opencode -m opencode-unlimited-proxy/deepseek-v4.1-flash-free
            </span>
          </div>
          <CopyButton
            text="opencode -m opencode-unlimited-proxy/deepseek-v4.1-flash-free"
            label="Copy command"
            variant="subtle"
            className="shrink-0"
          />
        </div>
      </div>
    </section>
  );
};

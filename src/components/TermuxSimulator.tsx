import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, ShieldCheck, Wifi } from 'lucide-react';
import { TERMINAL_SCENARIOS, TerminalLine } from '../data/runtimeData';

export const TermuxSimulator: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [runNonce, setRunNonce] = useState(0);

  const scenario = TERMINAL_SCENARIOS[activeIndex];

  useEffect(() => {
    setVisibleCount(1);
    const total = scenario.lines.length;
    let current = 1;

    const timer = window.setInterval(() => {
      current += 1;
      if (current >= total) {
        setVisibleCount(total);
        window.clearInterval(timer);
      } else {
        setVisibleCount(current);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [activeIndex, runNonce, scenario.lines.length]);

  const handleCycleTab = () => {
    setActiveIndex((prev) => (prev + 1) % TERMINAL_SCENARIOS.length);
  };

  const handleReplay = () => {
    setRunNonce((n) => n + 1);
  };

  const renderLine = (line: TerminalLine, idx: number) => {
    if (line.type === 'cmd') {
      return (
        <div key={idx} className="flex items-start gap-2 pt-1.5 pb-0.5 text-[#ECF2EE]">
          <span className="text-[#10E88A] select-none shrink-0 font-semibold">~ $</span>
          <span className="break-all font-medium">{line.text}</span>
        </div>
      );
    }

    if (line.type === 'ok') {
      return (
        <div key={idx} className="text-[#10E88A] leading-relaxed break-words">
          {line.text}
        </div>
      );
    }

    if (line.type === 'warn') {
      return (
        <div key={idx} className="text-[#F59E0B] leading-relaxed break-words">
          {line.text}
        </div>
      );
    }

    if (line.type === 'err') {
      return (
        <div key={idx} className="text-[#F87171] leading-relaxed break-words">
          {line.text}
        </div>
      );
    }

    if (line.type === 'box') {
      return (
        <div key={idx} className="text-[#B8C7BF] leading-snug whitespace-pre">
          {line.text}
        </div>
      );
    }

    if (line.type === 'output') {
      return (
        <div key={idx} className="text-[#ECF2EE] pl-2 border-l-2 border-[#10E88A]/60 my-1 py-0.5">
          {line.text}
        </div>
      );
    }

    return (
      <div key={idx} className="text-[#788A81] leading-relaxed break-words">
        {line.text}
      </div>
    );
  };

  const isStreaming = visibleCount < scenario.lines.length;

  return (
    <div className="w-full bg-[#0C100E] border border-[#232E29] shadow-[0_24px_70px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden">
      {/* Top Android / Termux Window Bar */}
      <div className="px-3.5 py-2.5 bg-[#121815] border-b border-[#1E2622] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A3630] border border-[#3B4B43]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A3630] border border-[#3B4B43]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10E88A]" />
          </div>
          <span className="text-[11px] font-mono text-[#94A39B] tracking-tight">
            u0_a291@termux:~ <span className="text-[#78897F]">(aarch64)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#090B0A] border border-[#24302A] text-[#F59E0B]">
            <Wifi className="w-3 h-3" />
            <span className="truncate max-w-[145px] sm:max-w-none">{scenario.warpExit}</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#10E88A]/10 border border-[#10E88A]/30 text-[#10E88A]">
            <ShieldCheck className="w-3 h-3" />
            <span>{scenario.badge}</span>
          </span>
        </div>
      </div>

      {/* Interactive Scenario Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#1E2622] bg-[#0E1311]">
        {TERMINAL_SCENARIOS.map((item, idx) => {
          const active = idx === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`px-3 py-2 text-left text-[11px] font-mono transition-colors border-r border-b sm:border-b-0 border-[#1E2622] last:border-r-0 cursor-pointer flex items-center justify-between gap-1.5 ${
                active
                  ? 'bg-[#151D19] text-[#10E88A] font-semibold'
                  : 'text-[#899990] hover:text-[#ECF2EE] hover:bg-[#121815]'
              }`}
            >
              <span className="truncate">
                <span className="text-[#78897F] mr-1">{idx + 1}:</span>
                {item.tabLabel}
              </span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#10E88A] shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Terminal Viewport */}
      <div className="p-4 sm:p-5 font-mono text-xs sm:text-[12.5px] min-h-[325px] max-h-[370px] overflow-auto term-scroll bg-[#090C0B] space-y-1">
        {scenario.lines.slice(0, visibleCount).map((line, idx) => renderLine(line, idx))}

        {/* Active prompt / cursor */}
        <div className="flex items-center gap-2 pt-2 text-[#10E88A]">
          <span className="select-none font-semibold">~ $</span>
          <span className="inline-block w-2 h-4 bg-[#10E88A] animate-cursor" />
          {isStreaming && (
            <span className="text-[11px] text-[#78897F] ml-2">running in termux-chroot...</span>
          )}
        </div>
      </div>

      {/* Authentic Termux Extra-Keys Bar */}
      <div className="px-2.5 py-2 bg-[#111614] border-t border-[#1E2622] flex items-center justify-between gap-2 text-[11px] font-mono select-none">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['ESC', '/', '-', 'HOME', '↑', 'END'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={handleReplay}
              title="Replay terminal output"
              className="px-2 py-1 bg-[#18201D] hover:bg-[#212B27] active:bg-[#10E88A]/20 text-[#B4C2BA] border border-[#26322C] transition-colors cursor-pointer"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={handleCycleTab}
            title="Switch simulation tab"
            className="px-2.5 py-1 bg-[#18201D] hover:border-[#10E88A]/60 text-[#10E88A] border border-[#2A3831] transition-colors cursor-pointer font-semibold"
          >
            TAB ⇥
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline text-[#78897F] tabular-nums">
            model: <span className="text-[#94A39B]">{scenario.activeModel}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (isStreaming) {
                setVisibleCount(scenario.lines.length);
              } else {
                handleReplay();
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#141B18] hover:bg-[#1C2521] text-[#C5D2CB] border border-[#28342E] transition-colors cursor-pointer"
          >
            {isStreaming ? (
              <>
                <Play className="w-3 h-3 text-[#10E88A]" />
                <span>Instant</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3 text-[#10E88A]" />
                <span>Replay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

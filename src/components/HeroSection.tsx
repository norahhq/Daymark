import React from 'react';
import { Sparkles, Clock, ArrowRight, Play, CheckCircle2, ShieldCheck, Compass } from 'lucide-react';

interface HeroSectionProps {
  availableMinutes: number;
  onChangeAvailableMinutes: (minutes: number) => void;
  onGeneratePlan: () => Promise<void>;
  isGenerating: boolean;
  pendingCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  availableMinutes,
  onChangeAvailableMinutes,
  onGeneratePlan,
  isGenerating,
  pendingCount,
}) => {
  const presetTimes = [
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: '3 hours', minutes: 180 },
    { label: '4 hours', minutes: 240 },
  ];

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#131726] to-[#0E111B] border border-white/[0.08] p-7 overflow-hidden">
      {/* Subtle background ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline and Description */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs text-lime-400 font-medium">
            <Compass className="w-4 h-4" />
            <span>Alexa+ Simulated Productivity Agent & MCP Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight text-balance">
            Make room for what matters.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Daymark turns natural-language requests into deterministic schedules, persistent task mutations,
            and realistic rest intervals. No manual dragging or disconnected suggestions—just your next best step.
          </p>

          {/* Time Budget Selector & Quick Actions */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-lime-400" />
                <span>Available Focus Window</span>
              </span>
              <span className="font-mono tabular-nums text-lime-400 font-semibold text-sm">
                {Math.floor(availableMinutes / 60)}h {availableMinutes % 60 > 0 ? `${availableMinutes % 60}m` : ''}
                <span className="text-slate-400 font-normal text-xs ml-1">({availableMinutes}m total)</span>
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {presetTimes.map((preset) => {
                const isSelected = availableMinutes === preset.minutes;
                return (
                  <button
                    key={preset.minutes}
                    onClick={() => onChangeAvailableMinutes(preset.minutes)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-lime-400/20 text-lime-300 border border-lime-400/40 shadow-sm'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onGeneratePlan}
                disabled={isGenerating || pendingCount === 0}
                className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-lime-400/10 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Calculating Optimal Schedule...' : 'Generate Day Plan'}</span>
              </button>

              <div className="text-xs text-slate-400 font-mono">
                {pendingCount} pending task{pendingCount === 1 ? '' : 's'} queued
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Mechanism Teaser / Workbench Diagram */}
        <div className="lg:col-span-5 bg-[#090B12]/80 border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs font-medium text-slate-300">Deterministic Engine Loop</span>
            <span className="font-mono text-[11px] text-lime-400">Strict Non-Overlapping</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-lime-400/10 text-lime-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <div>
                <span className="font-medium text-white block">Priority & Deadline Scoring</span>
                <span className="text-slate-400 text-[11px]">Weights urgencies, exam milestones, and timeframes.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-lime-400/10 text-lime-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <div>
                <span className="font-medium text-white block">Cognitive Buffer Insertion</span>
                <span className="text-slate-400 text-[11px]">Automatically adds 10-minute rest intervals between blocks.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-lime-400/10 text-lime-400 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <div>
                <span className="font-medium text-white block">Budget Enforcement & Conflict Detection</span>
                <span className="text-slate-400 text-[11px]">Guarantees no task overflows your available time.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified by automated tests</span>
            <span className="font-mono text-slate-300">Zero Hallucinated Numbers</span>
          </div>
        </div>
      </div>
    </div>
  );
};

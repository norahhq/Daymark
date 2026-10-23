import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { DayPlan, Task } from '../types/index.js';

interface DailyScheduleProps {
  plan: DayPlan | null;
  onGeneratePlan: (options: { availableMinutes: number; startTime: string }) => Promise<void>;
  isGenerating: boolean;
  onCompleteTask: (taskId: string) => Promise<void>;
}

export const DailySchedule: React.FC<DailyScheduleProps> = ({
  plan,
  onGeneratePlan,
  isGenerating,
  onCompleteTask,
}) => {
  const [availableMinutes, setAvailableMinutes] = useState(plan?.availableMinutes || 180);
  const [startTime, setStartTime] = useState(plan?.startTime || '09:00');

  const handleApplyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGeneratePlan({
      availableMinutes: Number(availableMinutes),
      startTime,
    });
  };

  return (
    <div className="space-y-6">
      {/* Schedule Configuration Bar */}
      <form
        onSubmit={handleApplyConfig}
        className="p-4 rounded-xl bg-[#10131E] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-lime-400" />
            <span>Start Time:</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-[#090A0F] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-lime-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-lime-400" />
            <span>Time Budget:</span>
            <select
              value={availableMinutes}
              onChange={(e) => setAvailableMinutes(Number(e.target.value))}
              className="bg-[#090A0F] border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-lime-400"
            >
              <option value="60">1 hour (60m)</option>
              <option value="90">1.5 hours (90m)</option>
              <option value="120">2 hours (120m)</option>
              <option value="180">3 hours (180m)</option>
              <option value="240">4 hours (240m)</option>
              <option value="300">5 hours (300m)</option>
              <option value="360">6 hours (360m)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="px-4 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Recomputing...' : 'Update Timeline'}</span>
        </button>
      </form>

      {/* Main Schedule View */}
      {!plan || plan.blocks.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#10131E] border border-white/[0.08] space-y-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-white">No active schedule</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set your available focus minutes above and generate a plan, or ask the Alexa+ conversational assistant to build one.
          </p>
          <button
            onClick={() => onGeneratePlan({ availableMinutes, startTime })}
            className="px-4 py-2 rounded-lg bg-lime-400 text-slate-950 font-semibold text-xs hover:bg-lime-300 transition-colors cursor-pointer"
          >
            Generate Today's Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline Summary Strip */}
          <div className="p-4 rounded-xl bg-[#121624] border border-white/[0.08] flex items-center justify-between text-xs flex-wrap gap-3">
            <div className="flex items-center gap-4 text-slate-300 font-mono tabular-nums">
              <span>
                Scheduled: <strong className="text-lime-400 font-bold">{plan.totalScheduledMinutes}m</strong>
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>
                Available: <strong className="text-white font-bold">{plan.availableMinutes}m</strong>
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>
                Remaining: <strong className="text-slate-300">{plan.remainingMinutes}m</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Utilization</span>
              <span className="font-mono tabular-nums text-xs font-bold text-lime-400">
                {plan.utilizationPercent}%
              </span>
            </div>
          </div>

          {/* Timeline Blocks */}
          <div className="space-y-3 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-white/[0.08]">
            {plan.blocks.map((block, index) => {
              const isBreak = block.type === 'break';

              return (
                <div
                  key={block.id || index}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isBreak
                      ? 'bg-[#0A0D15] border-dashed border-white/[0.08] text-slate-400'
                      : 'bg-[#10131E] border-white/[0.08] hover:border-lime-400/30'
                  }`}
                >
                  {/* Time Badge Column */}
                  <div className="w-16 shrink-0 text-right font-mono tabular-nums text-xs">
                    <span className="text-white font-medium block">{block.startTime}</span>
                    <span className="text-slate-400 text-[11px] block">{block.endTime}</span>
                  </div>

                  {/* Marker Circle */}
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isBreak
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                        : 'bg-lime-400/10 border-lime-400/40 text-lime-400'
                    }`}
                  >
                    {isBreak ? (
                      <Coffee className="w-2.5 h-2.5" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isBreak ? 'text-slate-400 italic' : 'text-white'
                          }`}
                        >
                          {block.title}
                        </span>
                      </div>

                      {/* Unboxed Metadata with · separator */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono tabular-nums">
                        <span>{block.durationMinutes} minutes</span>
                        {block.priority && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`capitalize ${
                                block.priority === 'high'
                                  ? 'text-lime-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              {block.priority} priority
                            </span>
                          </>
                        )}
                        {isBreak && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-400/80">Buffer & Context Refresh</span>
                          </>
                        )}
                      </div>
                    </div>

                    {!isBreak && block.taskId && (
                      <button
                        onClick={() => onCompleteTask(block.taskId!)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-lime-300 hover:bg-lime-400/10 border border-transparent hover:border-lime-400/20 transition-colors whitespace-nowrap"
                        title="Mark complete"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overflow / Tasks that did not fit */}
          {plan.overflowTasks && plan.overflowTasks.length > 0 && (
            <div className="p-5 rounded-xl bg-[#140F12] border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Tasks Exceeding Time Budget ({plan.overflowTasks.length})</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The scheduler prioritizes higher urgency and prevents overlapping beyond your {plan.availableMinutes}-minute limit. The following tasks remain safely in your backlog:
              </p>

              <div className="space-y-1.5 pt-1">
                {plan.overflowTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#090A0F]/60 border border-white/[0.04] text-xs"
                  >
                    <span className="text-slate-300 font-medium truncate">{task.title}</span>
                    <div className="flex items-center gap-2 text-slate-400 font-mono shrink-0">
                      <span>{task.durationMinutes}m</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{task.priority} priority</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

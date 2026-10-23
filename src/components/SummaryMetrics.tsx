import React from 'react';
import { Clock, CheckCircle2, ListTodo, Gauge } from 'lucide-react';

interface SummaryMetricsProps {
  pendingCount: number;
  scheduledMinutes: number;
  completedCount: number;
  utilizationPercent: number;
  availableMinutes: number;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  pendingCount,
  scheduledMinutes,
  completedCount,
  utilizationPercent,
  availableMinutes,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Pending Tasks */}
      <div className="p-4 rounded-xl bg-[#10131E] border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Pending Tasks</span>
          <ListTodo className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
            {pendingCount}
          </span>
          <span className="text-xs text-slate-400">items in queue</span>
        </div>
      </div>

      {/* Metric 2: Minutes Scheduled */}
      <div className="p-4 rounded-xl bg-[#10131E] border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Minutes Scheduled</span>
          <Clock className="w-4 h-4 text-lime-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-lime-400 tabular-nums">
            {scheduledMinutes}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            / {availableMinutes}m budget
          </span>
        </div>
      </div>

      {/* Metric 3: Completed Tasks */}
      <div className="p-4 rounded-xl bg-[#10131E] border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Completed Tasks</span>
          <CheckCircle2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
            {completedCount}
          </span>
          <span className="text-xs text-slate-400">done today</span>
        </div>
      </div>

      {/* Metric 4: Schedule Utilization */}
      <div className="p-4 rounded-xl bg-[#10131E] border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Schedule Utilization</span>
          <Gauge className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
              {utilizationPercent}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {availableMinutes - scheduledMinutes > 0
                ? `${availableMinutes - scheduledMinutes}m spare`
                : 'fully allocated'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-lime-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, utilizationPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

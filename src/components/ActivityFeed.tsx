import React from 'react';
import {
  Activity,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Terminal,
  RotateCcw,
  Edit3,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ActivityItem, ActivityActionType } from '../types/index.js';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActionIcon = (type: ActivityActionType) => {
    switch (type) {
      case 'task_created':
        return <PlusCircle className="w-3.5 h-3.5 text-lime-400" />;
      case 'task_completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />;
      case 'task_updated':
        return <Edit3 className="w-3.5 h-3.5 text-slate-300" />;
      case 'task_deleted':
        return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case 'plan_generated':
        return <Calendar className="w-3.5 h-3.5 text-lime-400" />;
      case 'assistant_tool_invoked':
      case 'mcp_tool_invoked':
        return <Terminal className="w-3.5 h-3.5 text-amber-300" />;
      case 'demo_loaded':
      case 'demo_reset':
        return <RotateCcw className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="rounded-2xl bg-[#10131E] border border-white/[0.08] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-lime-400" />
          <h3 className="text-xs font-semibold text-white">Application Activity Audit</h3>
        </div>
        <span className="font-mono text-xs text-slate-400 tabular-nums">
          {activities.length} recorded events
        </span>
      </div>

      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <div className="text-xs text-slate-400 py-8 text-center italic">
            No activity records yet. Tasks, schedule generations, and tool invocations will appear here.
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-[#090A0F] border border-white/[0.04] flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1 rounded-md bg-white/[0.04] shrink-0 mt-0.5">
                  {getActionIcon(item.actionType)}
                </div>
                <div className="min-w-0">
                  <span className="text-slate-200 font-medium block truncate">
                    {item.description}
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 capitalize">
                    {item.actionType.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                {formatTimestamp(item.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

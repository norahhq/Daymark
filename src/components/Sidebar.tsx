import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  Activity,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

export type NavigationTab = 'overview' | 'tasks' | 'plan' | 'assistant' | 'activity' | 'mcp';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pendingCount: number;
  scheduledMinutes: number;
  aiMode: 'local' | 'bedrock';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  scheduledMinutes,
  aiMode,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'plan',
      label: 'Daily Plan',
      icon: <Calendar className="w-4 h-4" />,
      badge: scheduledMinutes > 0 ? `${scheduledMinutes}m` : undefined,
    },
    { id: 'assistant', label: 'Alexa+ Assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'mcp', label: 'MCP Inspector', icon: <Terminal className="w-4 h-4" /> },
    { id: 'activity', label: 'Activity Feed', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0D0F17] border-r border-white/[0.08] flex flex-col justify-between min-h-screen select-none">
      <div>
        {/* Brand Lockup */}
        <div className="p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 font-bold text-sm tracking-tight">
              D
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-white block leading-tight">
                Daymark
              </span>
              <span className="text-[11px] text-slate-400 tracking-normal block leading-tight mt-0.5">
                Make the next step obvious.
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 whitespace-nowrap">
                  <span className={isActive ? 'text-lime-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="font-mono text-[10px] tabular-nums text-slate-400 font-normal">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Status Card */}
      <div className="p-4 border-t border-white/[0.08] space-y-3">
        <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.06] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-lime-400" />
              <span>AI Provider</span>
            </span>
            <span className="font-mono text-lime-400 capitalize">{aiMode} Mode</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>MCP Protocol</span>
            </span>
            <span className="font-mono text-slate-300">HTTP :3000/mcp</span>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 leading-normal border-t border-white/[0.04]">
            Simulated Alexa+ Interaction with live Streamable HTTP MCP tools.
          </div>
        </div>
      </div>
    </aside>
  );
};

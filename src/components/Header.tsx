import React, { useState } from 'react';
import { RefreshCw, RotateCcw, Sparkles, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentDateText: string;
  aiMode: 'local' | 'bedrock';
  onToggleAiMode: (mode: 'local' | 'bedrock') => void;
  onLoadDemo: () => Promise<void>;
  onResetDemo: () => Promise<void>;
  isLoadingDemo: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateText,
  aiMode,
  onToggleAiMode,
  onLoadDemo,
  onResetDemo,
  isLoadingDemo,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await onResetDemo();
      setShowResetConfirm(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.08] bg-[#090A0F]/90 backdrop-blur-md px-6 flex items-center justify-between gap-6 sticky top-0 z-20">
      {/* Left Zone: Title & Current Date */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">
            Your day, in focus.
          </h1>
          <div className="text-xs text-slate-400 font-mono tracking-tight mt-0.5">
            {currentDateText}
          </div>
        </div>
      </div>

      {/* Right Zone: Controls & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mode Selector Segmented Control */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#121622] border border-white/[0.08] text-xs">
          <button
            onClick={() => onToggleAiMode('local')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              aiMode === 'local'
                ? 'bg-lime-400/15 text-lime-400 border border-lime-400/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Deterministic local intent parser & scheduler (No AWS credentials required)"
          >
            Local Mode
          </button>
          <button
            onClick={() => onToggleAiMode('bedrock')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              aiMode === 'bedrock'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Amazon Bedrock LLM mode with graceful local fallback"
          >
            <span>AWS Bedrock</span>
          </button>
        </div>

        {/* Load Demo Data Button */}
        <button
          onClick={onLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161B2B] hover:bg-[#1E253A] text-slate-200 border border-white/[0.08] transition-colors whitespace-nowrap disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-lime-400 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          <span>Load Demo Data</span>
        </button>

        {/* Reset Workspace Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#10131E] border border-white/[0.12] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Reset Demo Workspace?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This will remove all current tasks, schedule blocks, and reset activity logs to a clean state.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1.5"
              >
                {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

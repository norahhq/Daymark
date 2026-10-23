import React, { useState, useEffect } from 'react';
import {
  Terminal,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  RefreshCw,
  Code,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { McpStatus, McpToolDefinition } from '../types/index.js';
import { executeMcpToolCall, fetchMcpStatus } from '../lib/api.js';

interface McpInspectorProps {
  onRefreshData: () => Promise<void>;
}

export const McpInspector: React.FC<McpInspectorProps> = ({ onRefreshData }) => {
  const [statusData, setStatusData] = useState<McpStatus | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('list_tasks');
  const [toolArgsText, setToolArgsText] = useState<string>('{\n  "filter": "all"\n}');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const loadStatus = async () => {
    setIsChecking(true);
    try {
      const data = await fetchMcpStatus();
      setStatusData(data);
    } catch (err) {
      console.error('MCP status check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSelectTool = (tool: McpToolDefinition) => {
    setSelectedTool(tool.name);
    // Provide sensible default JSON arguments based on tool name
    switch (tool.name) {
      case 'create_task':
        setToolArgsText('{\n  "title": "Review system architecture",\n  "duration_minutes": 45,\n  "priority": "high"\n}');
        break;
      case 'list_tasks':
        setToolArgsText('{\n  "filter": "pending"\n}');
        break;
      case 'complete_task':
        setToolArgsText('{\n  "task_id": "task-seed-1"\n}');
        break;
      case 'delete_task':
        setToolArgsText('{\n  "task_id": "task-seed-4"\n}');
        break;
      case 'generate_plan':
        setToolArgsText('{\n  "available_minutes": 180,\n  "start_time": "09:00",\n  "include_breaks": true\n}');
        break;
      case 'get_activity':
        setToolArgsText('{\n  "limit": 10\n}');
        break;
      case 'reset_demo':
        setToolArgsText('{}');
        break;
      default:
        setToolArgsText('{}');
        break;
    }
  };

  const handleExecuteTool = async () => {
    setIsRunning(true);
    setExecutionResult(null);

    let parsedArgs = {};
    try {
      if (toolArgsText.trim()) {
        parsedArgs = JSON.parse(toolArgsText);
      }
    } catch (err: any) {
      setExecutionResult({
        jsonrpc: '2.0',
        error: { code: -32700, message: `JSON Parse error: ${err.message}` },
      });
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        }),
      });
      const json = await res.json();
      setExecutionResult(json);
      await onRefreshData();
    } catch (err: any) {
      setExecutionResult({
        jsonrpc: '2.0',
        error: { code: -32603, message: err.message },
      });
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="p-5 rounded-2xl bg-[#10131E] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-lime-400" />
            <h3 className="text-sm font-semibold text-white">Streamable HTTP MCP Server Active</h3>
            <span className="font-mono text-xs text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded border border-lime-400/20">
              Protocol 2024-11-05
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Compliant with the Model Context Protocol (MCP) standard required by the Alexa+ hackathon track.
            Autonomous agents connect over HTTP to invoke typed task management and scheduling tools.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadStatus}
            disabled={isChecking}
            className="px-3 py-1.5 rounded-lg bg-[#161B2B] hover:bg-[#1E253A] text-slate-300 text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Health Check</span>
          </button>
        </div>
      </div>

      {/* Grid: Server Details & Tools List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tools Directory */}
        <div className="lg:col-span-5 rounded-2xl bg-[#10131E] border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-semibold text-white">Registered MCP Tools</span>
            <span className="font-mono text-xs text-slate-400">
              {statusData?.toolsCount || 8} tools exposed
            </span>
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {(statusData?.tools || []).map((tool) => {
              const isSelected = selectedTool === tool.name;

              return (
                <button
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-lime-400/10 border-lime-400/30 text-white'
                      : 'bg-[#090A0F] border-white/[0.04] text-slate-300 hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-lime-400">
                      {tool.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">tool</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {tool.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Interactive JSON-RPC Runner */}
        <div className="lg:col-span-7 rounded-2xl bg-[#10131E] border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-lime-400" />
              <span className="text-xs font-semibold text-white">
                Live Protocol Runner: <code className="font-mono text-lime-400">{selectedTool}</code>
              </span>
            </div>

            <button
              onClick={handleExecuteTool}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Executing...' : 'Invoke Tool'}</span>
            </button>
          </div>

          {/* Arguments Editor */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Input Arguments (JSON object)</span>
              <span className="font-mono text-[11px]">POST /mcp</span>
            </div>
            <textarea
              value={toolArgsText}
              onChange={(e) => setToolArgsText(e.target.value)}
              rows={4}
              className="w-full bg-[#090A0F] border border-white/[0.1] rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Response Viewer */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>JSON-RPC 2.0 Response</span>
              {executionResult && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(executionResult, null, 2))}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {isCopied ? <Check className="w-3 h-3 text-lime-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="bg-[#090A0F] border border-white/[0.1] rounded-xl p-3.5 max-h-56 overflow-y-auto">
              {executionResult ? (
                <pre className="font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-400 text-xs italic py-4 text-center">
                  Click "Invoke Tool" above to send a real Streamable HTTP JSON-RPC 2.0 request.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

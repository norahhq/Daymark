import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Wand2,
  Terminal,
  Clock,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage } from '../types/index.js';

interface ConversationalAssistantProps {
  onSendMessage: (text: string) => Promise<any>;
  messages: ChatMessage[];
  aiMode: 'local' | 'bedrock';
}

const SUGGESTED_PROMPTS = [
  'I have three hours tomorrow. Plan my tasks.',
  'Add revise calculus for 45 minutes.',
  'Mark the project prototype complete.',
  'I have an exam in two days. Help me prioritize.',
  'Show me what I should focus on next.',
];

export const ConversationalAssistant: React.FC<ConversationalAssistantProps> = ({
  onSendMessage,
  messages,
  aiMode,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      await onSendMessage(text);
    } catch (err: any) {
      setError(err.message || 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col h-[640px] rounded-2xl bg-[#0D0F17] border border-white/[0.08] overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-white/[0.08] bg-[#10131E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white">Daymark Alexa+ Agent Simulation</h3>
              <span className="font-mono text-[10px] text-slate-400">
                via {aiMode === 'bedrock' ? 'AWS Bedrock + Fallback' : 'Local Engine'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Natural-language actions routed directly to persistent SQLite store & MCP tools.
            </p>
          </div>
        </div>

        {/* Voice/Audio Wave Simulator Indicator */}
        <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#090A0F] border border-white/[0.06] text-[11px] text-slate-400 font-mono">
          <span className="text-lime-400">Alexa+</span>
          <div className="flex items-center gap-0.5 ml-1.5">
            <div className="w-0.5 h-2 bg-lime-400 rounded-full animate-pulse" />
            <div className="w-0.5 h-3.5 bg-lime-400 rounded-full animate-pulse [animation-delay:150ms]" />
            <div className="w-0.5 h-1.5 bg-lime-400 rounded-full animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      </div>

      {/* Suggested Prompts Strip */}
      <div className="p-3 bg-[#0A0C13] border-b border-white/[0.06] overflow-x-auto flex items-center gap-2 text-xs">
        <span className="text-slate-400 whitespace-nowrap text-[11px] font-medium shrink-0">
          Suggested:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md bg-[#131724] hover:bg-[#1A2033] text-slate-300 hover:text-white border border-white/[0.06] transition-colors whitespace-nowrap shrink-0 text-xs disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#1E253A] text-white border border-white/[0.08]'
                    : 'bg-[#121624] text-slate-200 border border-white/[0.08]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Structured Metadata & Real Execution Metrics */}
                {msg.toolInvoked && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5 text-lime-400">
                      <Terminal className="w-3 h-3" />
                      <span>mcp.{msg.toolInvoked}()</span>
                    </span>
                    {msg.actionTaken && (
                      <span className="text-slate-400 capitalize">{msg.actionTaken.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-xl bg-[#121624] border border-white/[0.08] flex items-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="font-mono text-[11px]">Interpreting intent & mutating store...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#10131E] border-t border-white/[0.08] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Alexa+ (e.g., 'Add revise calculus for 45 minutes' or 'Plan my day')..."
          disabled={isLoading}
          className="flex-1 bg-[#090A0F] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-lime-400 transition-colors"
        />

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Send request"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

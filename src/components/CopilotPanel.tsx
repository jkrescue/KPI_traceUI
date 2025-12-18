import React, { useState, useRef, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { X, Send, MessageSquare, Sparkles, Download, RefreshCw, Bookmark, Clock } from 'lucide-react';
import { CopilotEngine } from '../lib/copilotEngine';
import { parseQuery, QUICK_COMMANDS, QuickCommand } from '../lib/nlpParser';
import { ResponseGenerator } from '../lib/responseGenerator';
import { ContextManager } from '../lib/contextManager';
import { ReportGenerator, Report } from '../lib/reportGenerator';
import { CopilotChart } from './CopilotChart';

export interface CopilotMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: {
    nodes?: string[];
    edges?: string[];
    action?: 'highlight' | 'filter';
  };
}

interface CopilotPanelProps {
  nodes: Node[];
  edges: Edge[];
  onHighlight?: (nodeIds: string[], edgeIds: string[]) => void;
  onFilter?: (nodeIds: string[]) => void;
}

export function CopilotPanel({ nodes, edges, onHighlight, onFilter }: CopilotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CopilotEngine>(new CopilotEngine(nodes, edges));
  const contextRef = useRef<ContextManager>(new ContextManager());

  // 更新引擎数据
  useEffect(() => {
    engineRef.current.updateData(nodes, edges);
  }, [nodes, edges]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 添加欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          content: '👋 你好！我是指标链路分析助手。\n\n我可以帮你：\n- 📊 统计分析指标数据\n- 🔍 查询特定条件的节点\n- 🔗 追踪完整链路关系\n- 💡 识别风险和优化点\n\n试试下面的快捷命令，或直接输入你的问题！',
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleSendMessage = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // 模拟处理延迟
    setTimeout(() => {
      const response = processQuery(query);
      setMessages(prev => [...prev, response]);
      setIsProcessing(false);

      // 如果有高亮数据，触发回调
      if (response.data?.nodes && onHighlight) {
        onHighlight(response.data.nodes, response.data.edges || []);
      }
    }, 500);
  };

  const processQuery = (query: string): CopilotMessage => {
    const engine = engineRef.current;
    
    // 使用 NLP 解析器
    const parsed = parseQuery(query);
    console.log('🔍 解析结果:', parsed);
    console.log('📊 当前数据统计:', {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      kpiNodes: nodes.filter(n => n.data.category === 'kpi').length,
      achievedKPIs: nodes.filter(n => n.data.category === 'kpi' && n.data.metrics?.achieved).length,
      withModelKPIs: nodes.filter(n => n.data.category === 'kpi' && n.data.metrics?.modelType).length,
    });
    
    // 使用响应生成器
    const generator = new ResponseGenerator(engine, nodes, edges);
    const response = generator.generateResponse(parsed);
    
    console.log('💬 生成的响应:', response);
    
    return {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: response.content,
      timestamp: new Date(),
      data: response.nodes ? {
        nodes: response.nodes,
        edges: response.edges || [],
        action: response.action,
      } : undefined,
    };
  };

  const handleQuickCommand = (command: QuickCommand) => {
    handleSendMessage(command.query);
  };

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
            AI 助手
          </div>
        </button>
      )}

      {/* 侧边栏面板 */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-slate-900">AI 助手</h3>
                <p className="text-xs text-slate-600">指标链路分析</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* 快捷命令 */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-600 mb-2">快捷命令</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_COMMANDS.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickCommand(cmd)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                  disabled={isProcessing}
                >
                  <span className="text-xs text-slate-700">{cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-violet-200' : 'text-slate-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="px-4 py-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入你的问题..."
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 text-center">
              提示：可以询问指标状态、链路关系等问题
            </p>
          </div>
        </div>
      )}
    </>
  );
}
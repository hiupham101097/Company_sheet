import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Minimize2,
  ChevronRight,
  ExternalLink,
  Bot,
  HelpCircle,
  Clock,
  Laptop,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';
import { api } from '../../services/api';

export function AIAssistantWidget({
  activeTab = 'dashboard',
  userRole = 'STAFF',
  currentUser = null,
  onNavigate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 Xin chào ${currentUser?.name || 'bạn'}! Mình là **OMNI-Bot**, linh vật trợ lý AI của hệ thống.\n\nMình có thể giải đáp mọi thắc mắc và hướng dẫn bạn thao tác nhanh trên trang web:`,
      suggestions: [
        'Quy định giờ chấm công & đi muộn',
        'Cách xuất biên bản bàn giao A4',
        'Kiểm tra công việc sắp đến hạn',
        'Hướng dẫn thêm tài sản mới'
      ],
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isOpen]);

  // Hide initial greeting tooltip after 10s if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isTyping) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await api.aiChat({
        message: query,
        activeTab,
        userRole,
        userName: currentUser?.name
      });

      if (res.success && res.data) {
        let finalReply = res.data.reply;

        // Nếu máy chủ Cloudflare bị Google hạn chế theo IP datacenter ("User location is not supported"),
        // Trình duyệt tại máy người dùng (IP Việt Nam) sẽ tự động gọi trực tiếp Gemini API (CORS được hỗ trợ 100%)
        if (res.data.needClientGemini && res.data.geminiApiKey) {
          const candidateModels = [
            'gemini-flash-latest',
            'gemini-3.5-flash',
            'gemini-3.8-flash',
            'gemini-3.1-flash-lite'
          ];
          if (res.data.geminiModel && !candidateModels.includes(res.data.geminiModel)) {
            candidateModels.unshift(res.data.geminiModel);
          }

          for (const modelName of candidateModels) {
            try {
              const clientGeminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${res.data.geminiApiKey}`;
              const geminiRes = await fetch(clientGeminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      role: 'user',
                      parts: [
                        { text: `${res.data.systemPrompt || ''}\n\n---\nNgười dùng hỏi: "${query}"` }
                      ]
                    }
                  ],
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 3072
                  }
                })
              });

              if (geminiRes.ok) {
                const geminiJson = await geminiRes.json();
                const candidate = geminiJson.candidates?.[0];
                const parts = candidate?.content?.parts || [];
                const textParts = parts.filter(p => typeof p.text === 'string' && !p.thought).map(p => p.text);
                const fullText = textParts.length > 0 ? textParts.join('\n\n') : parts.map(p => p.text).filter(Boolean).join('\n\n');
                if (fullText && fullText.trim()) {
                  finalReply = fullText.trim();
                  break; // Thành công, thoát vòng lặp fallback
                }
              } else {
                console.warn(`Direct Gemini call with model ${modelName} returned status ${geminiRes.status}. Trying next fallback model...`);
                if (geminiRes.status === 429 || geminiRes.status === 503) {
                  await new Promise(resolve => setTimeout(resolve, 350));
                }
              }
            } catch (geminiClientErr) {
              console.warn(`Direct client Gemini fetch error on ${modelName}:`, geminiClientErr);
            }
          }
        }

        const botMsg = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: finalReply,
          suggestions: res.data.suggestions || [],
          navigateTab: res.data.navigateTab || null,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.message || 'Không có phản hồi');
      }
    } catch (err) {
      // Client-side fallback smart responses
      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `💡 **Trợ lý OMNI-Bot:**\n\nBạn có thể nhấp trực tiếp vào các mục hướng dẫn nhanh bên dưới để tôi hỗ trợ bạn xử lý công việc nhé:`,
        suggestions: [
          'Quy định giờ chấm công',
          'Cách xuất biên bản bàn giao A4',
          'Quản lý tài sản thiết bị',
          'Theo dõi doanh thu chi phí'
        ],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: 'bot',
        text: `✨ Cuộc trò chuyện đã được làm mới. Bạn cần hỗ trợ gì về hệ thống hôm nay?`,
        suggestions: [
          'Quy định giờ chấm công',
          'Cách xuất biên bản bàn giao A4',
          'Hướng dẫn thêm tài sản mới',
          'Phân quyền tài khoản'
        ],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Simple Markdown-like formatter for bold and code
  const formatText = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Process bold **text** and code `code`
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <span key={lIdx} className="block leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="px-1.5 py-0.5 rounded bg-pastel-100 text-pastel-800 text-[11px] font-mono font-semibold">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* ================= 1. FLOATING COLLAPSED WIDGET (DẤU NỔI GÓC PHẢI) ================= */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 select-none">
          {/* Friendly Greeting Speech Bubble */}
          {showTooltip && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-2xl shadow-soft-lg border border-pastel-200/90 text-xs font-semibold animate-fade-in relative max-w-xs">
              <span>Xin chào! Mình là OMNI-Bot, cần trợ giúp gì cứ hỏi mình nhé ✨</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Đóng lời chào"
              >
                <X size={13} />
              </button>
              {/* Tooltip triangle tail */}
              <div className="absolute right-[-6px] bottom-4 w-3 h-3 bg-white border-r border-b border-pastel-200/90 rotate-[-45deg]" />
            </div>
          )}

          {/* Floating Mascot Trigger Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="group relative flex items-center justify-center focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95"
            title="Mở Trợ lý AI OMNI-Bot"
          >
            {/* Glowing animated background aura */}
            <div className="absolute inset-0 rounded-full bg-pastel-400/30 blur-md group-hover:bg-pastel-400/50 transition-all animate-pulse" />

            {/* Mascot Image with floating animation */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 animate-float-mascot drop-shadow-xl flex items-center justify-center">
              <img
                src="/mascot.png"
                alt="OMNI-Bot AI"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>

            {/* Online Status Badge */}
            <span className="absolute bottom-0 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
            </span>

            {/* Mini Label badge */}
            <span className="absolute -bottom-2 bg-pastel-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft whitespace-nowrap">
              Trợ lý AI
            </span>
          </button>
        </div>
      )}

      {/* ================= 2. POPUP CHAT BOX WITH MASCOT BESIDE (Ô POPUP CHAT) ================= */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex items-end animate-scale-in">
          
          {/* Mascot companion perched BESIDE the chat popup on the left (outside overflow-hidden) */}
          <div className="hidden lg:flex flex-col items-center mr-3 mb-2 pointer-events-none drop-shadow-2xl z-10 animate-float-mascot shrink-0">
            <div className="w-20 h-24 xl:w-24 xl:h-28">
              <img
                src="/mascot.png"
                alt="OMNI-Bot Companion"
                className="w-full h-full object-contain filter drop-shadow-lg"
              />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-pastel-600/95 text-white text-[9px] font-bold shadow-soft whitespace-nowrap mt-1">
              Trợ lý OMNI-Bot
            </span>
          </div>

          {/* Main Chat Popup Container */}
          <div className="w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-soft-lg border border-pastel-200 flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 px-4 sm:px-5 border-b border-pastel-100 bg-gradient-to-r from-pastel-50 via-white to-pastel-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Header Mascot Avatar */}
                <div className="w-10 h-10 rounded-xl bg-white border border-pastel-200 p-1 shadow-soft flex items-center justify-center shrink-0">
                  <img src="/mascot.png" alt="OMNI-Bot" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">OMNI-Bot</h3>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      Trợ lý AI
                    </span>
                  </div>
                  <p className="text-[11px] text-pastel-700 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Trực tuyến • Sẵn sàng hỗ trợ</span>
                  </p>
                </div>
              </div>

            {/* Header action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Thu nhỏ trợ lý"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot Icon */}
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-pastel-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot size={15} />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-pastel-500 text-white rounded-br-none'
                        : 'bg-white text-slate-700 border border-pastel-200/80 rounded-tl-none'
                    }`}
                  >
                    {formatText(msg.text)}

                    {/* Quick navigation pill if suggested */}
                    {msg.navigateTab && onNavigate && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            onNavigate(msg.navigateTab);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pastel-50 hover:bg-pastel-100 text-pastel-700 font-bold text-[11px] transition-all border border-pastel-200"
                        >
                          <span>Mở chức năng này ngay</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white hover:bg-pastel-50 text-pastel-700 border border-pastel-200/90 shadow-2xs hover:border-pastel-300 transition-all text-left"
                        >
                          💬 {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className={`block text-[10px] text-slate-400 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-2xl border border-pastel-200/70 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-pastel-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-pastel-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-pastel-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-slate-500 font-medium ml-1">OMNI-Bot đang suy nghĩ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Common Questions Bar */}
          <div
            className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => handleSendMessage('Quy định giờ chấm công thế nào?')}
              className="text-[10px] font-semibold text-slate-600 hover:text-pastel-700 bg-slate-50 hover:bg-pastel-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1"
            >
              <Clock size={11} className="text-pastel-600" />
              <span>Giờ chấm công</span>
            </button>
            <button
              onClick={() => handleSendMessage('Làm sao để xuất biên bản bàn giao A4?')}
              className="text-[10px] font-semibold text-slate-600 hover:text-pastel-700 bg-slate-50 hover:bg-pastel-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1"
            >
              <FileText size={11} className="text-pastel-600" />
              <span>In biên bản A4</span>
            </button>
            <button
              onClick={() => handleSendMessage('Hướng dẫn thêm tài sản mới')}
              className="text-[10px] font-semibold text-slate-600 hover:text-pastel-700 bg-slate-50 hover:bg-pastel-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1"
            >
              <Laptop size={11} className="text-pastel-600" />
              <span>Thêm tài sản</span>
            </button>
            <button
              onClick={() => handleSendMessage('Kiểm tra công việc quá hạn')}
              className="text-[10px] font-semibold text-slate-600 hover:text-pastel-700 bg-slate-50 hover:bg-pastel-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shrink-0 transition-colors flex items-center gap-1"
            >
              <Sparkles size={11} className="text-amber-500" />
              <span>Việc quá hạn</span>
            </button>
          </div>

          {/* Message Input Footer */}
          <div className="p-3 bg-white border-t border-pastel-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi OMNI-Bot về quy trình, tài sản, chấm công..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-pastel-200/90 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pastel-400 bg-pastel-50/40 font-medium"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="p-2.5 rounded-xl bg-pastel-500 hover:bg-pastel-600 active:scale-95 text-white transition-all disabled:opacity-40 disabled:hover:bg-pastel-500 shadow-soft shrink-0"
                title="Gửi câu hỏi"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
  </>
);
}

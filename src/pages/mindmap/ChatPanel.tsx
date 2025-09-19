import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const sendAiMessage = async (prompt: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 600));
    return `예시 응답: “${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}” 에 대한 가이드입니다.`;
  };

  const send = async () => {
    const content = input.trim();
    if (!content || isSending) return;
    setIsSending(true);
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const answer = await sendAiMessage(content);
      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: 'assistant', content: answer, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      toast.error('AI 응답 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full h-full border-l border-neutral-200 flex flex-col bg-white">
      <div className="px-4 py-3.5 border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="text-sm font-semibold text-sky-700">AI Chat</div>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 shadow-sm ring-1 ${
                m.role === 'user'
                  ? 'bg-sky-500 text-white ring-sky-500/30 rounded-br-lg'
                  : 'bg-neutral-100 text-neutral-800 ring-neutral-200 rounded-bl-lg'
              }`}
            >
              <p>{m.content}</p>
              <div className="mt-1.5 text-right text-[11px] opacity-60">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-lg px-4 py-2.5 shadow-sm ring-1 bg-neutral-100 text-neutral-900 ring-neutral-200">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse [animation-delay:120ms]"></span>
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse [animation-delay:240ms]"></span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-400 shadow-sm transition-all">
          <textarea
            className="w-full bg-transparent resize-none p-3 text-sm outline-none h-24 placeholder:text-neutral-400"
            placeholder="AI에게 질문해보세요… (Shift+Enter 줄바꿈)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
        </div>
        <div className="flex justify-between items-center mt-2.5">
          <div className="text-[12px] text-neutral-500">Enter: 전송 · Shift+Enter: 줄바꿈</div>
          <button
            onClick={() => void send()}
            disabled={isSending || !input.trim()}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:from-sky-600 hover:to-sky-700 active:scale-[0.98] transition-all"
            aria-label="Send message"
          >
            {isSending ? '전송 중…' : '전송 ✈️'}
          </button>
        </div>
      </div>
    </div>
  );
};

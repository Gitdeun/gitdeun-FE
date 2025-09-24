import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sendMindmapPrompt } from '../../api/mindmap';

export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };


export const ChatPanel: React.FC<{ mapId: number; showHistory?: boolean }> = ({ mapId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [pendingAnalysisCount, setPendingAnalysisCount] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setPendingAnalysisCount(0);
  }, [mapId]);

  useEffect(() => {
    const handler = (_e: Event) => {
      const m: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '요청하신 내용을 적용시켰습니다.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, m]);
      setPendingAnalysisCount((c) => Math.max(0, c - 1));
    };
    window.addEventListener('mindmap:analysis_prompt', handler);
    return () => window.removeEventListener('mindmap:analysis_prompt', handler);
  }, []);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

 

  const send = async () => {
    const content = input.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setPendingAnalysisCount((c) => c + 1);
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      await sendMindmapPrompt(mapId, content);
      toast.success('요청이 전송되었습니다. 최대 5분 정도 소요되며 변경 후 알림이 전송됩니다.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '요청 전송 중 오류가 발생했습니다.';
      toast.error(msg);
      setPendingAnalysisCount((c) => Math.max(0, c - 1));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full h-full border-l border-neutral-200 flex flex-col bg-white">
      <div className="px-4 py-4 sm:py-5 border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="text-sm font-semibold text-sky-700">AI Chat</div>
      </div>
      <div className="flex-1 flex overflow-hidden min-w-0">

        <div className={'flex-1 min-w-0 flex flex-col'}>
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4" aria-live="polite">
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
            {(isSending || pendingAnalysisCount > 0) && (
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
          <div className="border-t border-neutral-200 p-3 sm:p-4 bg-white">
            <div className="rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-400 shadow-sm transition-all">
              <textarea
                className="w-full bg-transparent resize-none p-3 text-sm outline-none h-24 placeholder:text-neutral-400"
                placeholder="질문에 마인드맵 노드명 또는 파일명을 포함해주세요."
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
      </div>
    </div>
  );
};

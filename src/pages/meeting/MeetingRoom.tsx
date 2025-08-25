import { useState } from 'react';
import { MeetingRoom } from '../../components/meeting/MeetingRoom';
import { MeetingSidebar } from '../../components/meeting/MeetingSidebar';
import { Toaster } from '../../components/ui/sonner';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleMeeting = () => {
    setIsActive(prevIsActive => {
      const nextIsActive = !prevIsActive;
      setIsRecording(nextIsActive);
      return nextIsActive;
    });
  };

  return (
    <div
      className="h-screen flex flex-col bg-slate-50 text-slate-800"
    >
      {/* 헤더 */}
      <header className="shrink-0 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-200">
        <div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMeeting}
            className={`h-10 px-5 rounded-lg font-semibold text-white shadow-sm transition-all duration-200 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isActive ? "회의 종료" : "회의 시작"}
          </button>
        </div>
      </header>

      {/* 본문: 메인 + 사이드바 */}
      <main className="flex-1 min-h-0">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_384px]">
          {/* 회의 영역 */}
          <section className="min-h-0">
            <MeetingRoom
              isActive={isActive}
              isRecording={isRecording}
              onToggleMeeting={handleToggleMeeting}
              onToggleRecording={() => {}} // 녹음 버튼이 없으므로 빈 함수 전달
            />
          </section>

          {/* 사이드바 */}
          <aside className="hidden lg:block min-h-0 bg-white border-l border-slate-200">
            <MeetingSidebar isRecording={isRecording} isActive={isActive} />
          </aside>
        </div>
      </main>

      <Toaster />
    </div>
  );
}